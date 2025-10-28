"use strict";exports.id=5,exports.ids=[5],exports.modules={7690:(e,a,t)=>{t.d(a,{Z:()=>h});var i=t(3854),r=t(4218),s=t(8041),l=t(7689),n=t(4358),d=t(4448),o=t(2432),c=t(9866),m=t(485),g=t(8998),p=t(4937);function h({onFileSelect:e,onFolderSelect:a,allowFileSelection:t=!0,allowFolderSelection:h=!0,showCreateFolder:f=!1,mode:u="browse"}){let[x,b]=(0,r.useState)([]),[v,j]=(0,r.useState)(!1),[y,w]=(0,r.useState)([]),[k,N]=(0,r.useState)(null),[C,F]=(0,r.useState)(""),[E,_]=(0,r.useState)(""),[S,L]=(0,r.useState)(!1),[Z,z]=(0,r.useState)(null),[T,D]=(0,r.useState)(!1),[B,R]=(0,r.useState)(""),[$,U]=(0,r.useState)(!1),[I,W]=(0,r.useState)([]),[A,M]=(0,r.useState)(!1),[O,H]=(0,r.useState)({uploaded:0,total:0,currentFile:""}),P=async(e=null)=>{j(!0),z(null);try{let a=await (0,p.D)(e);return b(a),a}catch(e){return console.error("Error fetching files:",e),z(e instanceof Error?e.message:"Failed to fetch files"),b([]),[]}finally{j(!1)}},Y=async(e=null)=>{let a=await P(e),t=a.filter(e=>"application/vnd.google-apps.folder"===e.mimeType);return t.map(a=>({id:a.id,name:a.name,children:[],isExpanded:!1,isLoaded:!1,parentId:e||void 0}))},V=async e=>{let a=await P(e),t=a.filter(e=>"application/vnd.google-apps.folder"===e.mimeType);return t.map(a=>({id:a.id,name:a.name,children:[],isExpanded:!1,isLoaded:!1,parentId:e}))},K=async e=>{let a=t=>t.map(t=>t.id===e?{...t,isExpanded:!t.isExpanded,children:t.isExpanded?t.children:[],isLoaded:!!t.isExpanded&&t.isLoaded}:{...t,children:a(t.children)});w(e=>a(e));let t=(e,a)=>{for(let i of e){if(i.id===a)return i;let e=t(i.children,a);if(e)return e}return null},i=t(y,e);if(i&&!i.isExpanded&&!i.isLoaded){let a=await V(e),t=i=>i.map(i=>i.id===e?{...i,children:a,isLoaded:!0,isExpanded:!0}:{...i,children:t(i.children)});w(e=>t(e))}},q=(e,t)=>{N(e),F(t),a&&a(e,t)},G=async e=>{if(!e.trim()){L(!1);return}j(!0),L(!0),z(null);try{let a=await (0,p._I)(e);b(a)}catch(e){console.error("Error searching files:",e),z(e instanceof Error?e.message:"Failed to search files"),b([])}finally{j(!1)}},J=async(e,a=null)=>{j(!0);try{let t=await (0,p.al)(e,a||k),i=await Y();return w(i),t}catch(e){console.error("Error creating folder:",e),z(e instanceof Error?e.message:"Failed to create folder")}finally{j(!1)}},Q=async(e,a)=>{M(!0),H({uploaded:0,total:e.length,currentFile:""});try{let t=await (0,p.z6)(e,a,(e,a,t)=>{H({uploaded:e,total:a,currentFile:t})});U(!1),W([]),H({uploaded:0,total:0,currentFile:""}),e.map(e=>e.name).join(", ");let i=1===e.length?`File "${e[0].name}" uploaded successfully to "${C}"`:`${e.length} files uploaded successfully to "${C}"`;return alert(i),k&&P(k),t}catch(e){console.error("Error uploading files:",e),z(e instanceof Error?e.message:"Failed to upload files")}finally{M(!1),H({uploaded:0,total:0,currentFile:""})}},X=async()=>{B.trim()&&(await J(B.trim()),D(!1),R(""))},ee=(e,a=0)=>(0,i.jsxs)("div",{style:{marginLeft:`${20*a}px`},children:[(0,i.jsxs)("div",{className:`folder-tree-item ${k===e.id?"selected":""}`,onClick:()=>q(e.id,e.name),children:[i.jsx("button",{className:"expand-button",onClick:a=>{a.stopPropagation(),K(e.id)},children:e.isExpanded?i.jsx(s.Z,{style:{width:"16px",height:"16px"}}):i.jsx(l.Z,{style:{width:"16px",height:"16px"}})}),i.jsx(n.Z,{className:"folder-icon"}),i.jsx("span",{className:"folder-name",children:e.name}),k===e.id&&i.jsx(d.Z,{className:"selected-icon"})]}),e.isExpanded&&e.children.map(e=>ee(e,a+1))]},e.id);return(0,r.useEffect)(()=>{let e=async()=>{let e=await Y();w(e)};e()},[]),(0,i.jsxs)("div",{className:"google-drive-explorer",children:[i.jsx("style",{dangerouslySetInnerHTML:{__html:`
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
        `}}),(0,i.jsxs)("div",{className:"drive-header",children:[(0,i.jsxs)("div",{className:"drive-search",children:[i.jsx(o.Z,{className:"drive-search-icon"}),i.jsx("input",{type:"text",placeholder:"Search files and folders...",value:E,onChange:e=>{let a=e.target.value;if(_(a),a.trim()){let e=setTimeout(()=>G(a),300);return()=>clearTimeout(e)}L(!1),b([])}})]}),k&&(0,i.jsxs)("div",{className:"selected-folder-info",children:[i.jsx(n.Z,{style:{width:"16px",height:"16px"}}),(0,i.jsxs)("span",{children:["Selected: ",i.jsx("strong",{children:C})]})]}),i.jsx("div",{className:"drive-actions",children:k&&(0,i.jsxs)("button",{onClick:()=>U(!0),className:"drive-action-btn primary",children:[i.jsx(c.Z,{style:{width:"16px",height:"16px"}}),"Upload to ",C]})})]}),(0,i.jsxs)("div",{className:"drive-content",children:[Z&&i.jsx("div",{className:"drive-error",children:(0,i.jsxs)("p",{children:["Error: ",Z]})}),S?(0,i.jsxs)("div",{className:"search-results",children:[(0,i.jsxs)("div",{className:"search-info",children:['Showing search results for "',E,'"']}),v?i.jsx("div",{className:"drive-loading",children:i.jsx("div",{children:"Searching..."})}):0===x.length?(0,i.jsxs)("div",{className:"drive-empty",children:[i.jsx(m.Z,{className:"drive-empty-icon"}),i.jsx("p",{children:"No files found"})]}):i.jsx("div",{className:"drive-file-list",children:x.map(a=>(0,i.jsxs)("div",{className:"drive-file-item",onClick:()=>{"application/vnd.google-apps.folder"===a.mimeType?q(a.id,a.name):e&&e(a)},children:[i.jsx("div",{className:`drive-file-icon ${"application/vnd.google-apps.folder"===a.mimeType?"folder":"file"}`,children:"application/vnd.google-apps.folder"===a.mimeType?i.jsx(n.Z,{}):i.jsx(m.Z,{})}),(0,i.jsxs)("div",{className:"drive-file-info",children:[i.jsx("div",{className:"drive-file-name",children:a.name}),i.jsx("div",{className:"drive-file-meta",children:"application/vnd.google-apps.folder"===a.mimeType?"Folder":"File"})]})]},a.id))})]}):(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)("div",{className:"folder-tree-panel",children:[(0,i.jsxs)("h3",{className:"panel-title",children:[i.jsx("span",{className:"panel-title-text",children:"\uD83D\uDCC1 Folder Structure"}),f&&(0,i.jsxs)("button",{onClick:()=>D(!0),className:"new-folder-btn",children:[i.jsx(g.Z,{style:{width:"14px",height:"14px"}}),"New Folder"]})]}),v?i.jsx("div",{className:"drive-loading",children:i.jsx("div",{children:"Loading folders..."})}):0===y.length?(0,i.jsxs)("div",{className:"drive-empty",children:[i.jsx(n.Z,{className:"drive-empty-icon"}),i.jsx("p",{children:"No folders found"})]}):i.jsx("div",{className:"folder-tree",children:y.map(e=>ee(e))})]}),(0,i.jsxs)("div",{className:"files-panel",children:[(0,i.jsxs)("h3",{className:"panel-title",children:["\uD83D\uDCC4 Files ",C&&`in "${C}"`]}),k?i.jsx("div",{children:i.jsx("div",{className:"drive-file-list",children:x.filter(e=>"application/vnd.google-apps.folder"!==e.mimeType).map(a=>(0,i.jsxs)("div",{className:"drive-file-item",onClick:()=>e&&e(a),children:[i.jsx(m.Z,{className:"drive-file-icon file"}),(0,i.jsxs)("div",{className:"drive-file-info",children:[i.jsx("div",{className:"drive-file-name",children:a.name}),i.jsx("div",{className:"drive-file-meta",children:a.size?`${Math.round(parseInt(a.size)/1024)} KB`:"File"})]})]},a.id))})}):(0,i.jsxs)("div",{className:"drive-empty",children:[i.jsx(m.Z,{className:"drive-empty-icon"}),i.jsx("p",{children:"Select a folder to view its files"})]})]})]})]}),T&&i.jsx("div",{className:"dialog-overlay",onClick:()=>D(!1),children:(0,i.jsxs)("div",{className:"dialog-content",onClick:e=>e.stopPropagation(),children:[i.jsx("h3",{className:"dialog-title",children:"Create New Folder"}),i.jsx("input",{type:"text",className:"dialog-input",placeholder:"Folder name",value:B,onChange:e=>R(e.target.value),onKeyPress:e=>{"Enter"===e.key&&X()},autoFocus:!0}),(0,i.jsxs)("div",{className:"dialog-actions",children:[i.jsx("button",{onClick:()=>D(!1),className:"dialog-btn dialog-btn-secondary",children:"Cancel"}),i.jsx("button",{onClick:X,className:"dialog-btn dialog-btn-primary",disabled:!B.trim(),children:"Create"})]})]})}),$&&i.jsx("div",{className:"dialog-overlay",onClick:()=>U(!1),children:(0,i.jsxs)("div",{className:"dialog-content",onClick:e=>e.stopPropagation(),children:[i.jsx("h3",{className:"dialog-title",children:"Upload File"}),(0,i.jsxs)("div",{className:"upload-info",children:[i.jsx("strong",{children:"Upload to:"})," ",C]}),i.jsx("div",{className:"file-input",children:i.jsx("input",{type:"file",multiple:!0,onChange:e=>{let a=e.target.files;a&&W(Array.from(a))},accept:"*/*"})}),I.length>0&&(0,i.jsxs)("div",{style:{marginBottom:"1rem",fontSize:"0.875rem",color:"#6b7280"},children:[i.jsx("div",{style:{marginBottom:"0.5rem"},children:(0,i.jsxs)("strong",{children:["Selected ",I.length," file",1===I.length?"":"s",":"]})}),i.jsx("div",{style:{maxHeight:"150px",overflowY:"auto",background:"#f9fafb",padding:"0.5rem",borderRadius:"4px",border:"1px solid #e5e7eb"},children:I.map((e,a)=>(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.25rem 0",borderBottom:a<I.length-1?"1px solid #e5e7eb":"none"},children:[i.jsx("span",{style:{flex:1,marginRight:"0.5rem",fontSize:"0.8rem"},children:e.name}),(0,i.jsxs)("span",{style:{fontSize:"0.75rem",color:"#6b7280"},children:["(",Math.round(e.size/1024)," KB)"]}),i.jsx("button",{onClick:()=>{let e=I.filter((e,t)=>t!==a);W(e)},style:{marginLeft:"0.5rem",background:"#ef4444",color:"#ffffff",border:"none",borderRadius:"4px",padding:"0.25rem 0.5rem",fontSize:"0.7rem",cursor:"pointer"},children:"Remove"})]},a))}),(0,i.jsxs)("div",{style:{marginTop:"0.5rem",fontSize:"0.75rem",color:"#6b7280"},children:["Total size: ",(0,i.jsxs)("strong",{children:[Math.round(I.reduce((e,a)=>e+a.size,0)/1024)," KB"]})]})]}),A&&O.total>0&&(0,i.jsxs)("div",{style:{marginBottom:"1rem",padding:"0.75rem",background:"#f0f9ff",border:"1px solid #3b82f6",borderRadius:"6px"},children:[(0,i.jsxs)("div",{style:{marginBottom:"0.5rem",fontSize:"0.85rem",fontWeight:"600",color:"#1e40af"},children:["Upload Progress: ",O.uploaded," of ",O.total," files"]}),i.jsx("div",{style:{width:"100%",height:"8px",background:"#e5e7eb",borderRadius:"4px",overflow:"hidden",marginBottom:"0.5rem"},children:i.jsx("div",{style:{width:`${O.uploaded/O.total*100}%`,height:"100%",background:"#3b82f6",transition:"width 0.3s ease"}})}),O.currentFile&&"Complete"!==O.currentFile&&(0,i.jsxs)("div",{style:{fontSize:"0.8rem",color:"#6b7280"},children:["Currently uploading: ",i.jsx("strong",{children:O.currentFile})]})]}),(0,i.jsxs)("div",{className:"dialog-actions",children:[i.jsx("button",{onClick:()=>{U(!1),W([])},className:"dialog-btn dialog-btn-secondary",children:"Cancel"}),i.jsx("button",{onClick:()=>{I.length>0&&k&&Q(I,k)},className:"dialog-btn dialog-btn-primary",disabled:0===I.length||A,children:A?O.total>1?`Uploading ${O.uploaded}/${O.total} files...`:"Uploading...":`Upload ${I.length} file${1===I.length?"":"s"}`})]})]})})]})}},2591:(e,a,t)=>{t.d(a,{Z:()=>x});var i=t(3854),r=t(4218);t(3638);var s=t(199);let l=r.forwardRef(function({title:e,titleId:a,...t},i){return r.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":a},t),e?r.createElement("title",{id:a},e):null,r.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"}))});var n=t(2150),d=t(856),o=t(1888),c=t(6835),m=t(9072),g=t(4063),p=t(4791),h=t(9402);t(6837),t(4937),t(485),t(9866),t(4358),t(7690);let f=[{value:"low",label:"Low",icon:"",color:"#10b981"},{value:"medium",label:"Medium",icon:"",color:"#f59e0b"},{value:"high",label:"High",icon:"",color:"#ef4444"},{value:"urgent",label:"Urgent",icon:"",color:"#dc2626"}],u=[{value:"todo",label:"To Do",icon:"",color:"#e5e7eb"},{value:"in_progress",label:"In Progress",icon:"",color:"#dbeafe"},{value:"review",label:"Review",icon:"",color:"#fef3c7"},{value:"done",label:"Done",icon:"",color:"#d1fae5"}];function x({task:e,users:a,onClose:t,onSave:x,onStatusChange:b,onDelete:v}){var j,y,w;let[k,N]=(0,r.useState)(!1),[C,F]=(0,r.useState)(!1),[E,_]=(0,r.useState)("task"),S=(0,r.useCallback)(e=>{if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;if(e.includes("T"))return e.split("T")[0];let a=new Date(e);return isNaN(a.getTime())?"":a.toISOString().split("T")[0]},[]),[L,Z]=(0,r.useState)({name:e.name,description:e.description,priority:e.priority,due_date:S(e.due_date),start_date:S(e.start_date),assignee_ids:e.assignees?e.assignees.map(e=>e.id):e.assignee?[e.assignee.id]:[],tags:e.tags_list.join(", ")});(0,r.useEffect)(()=>{Z({name:e.name,description:e.description,priority:e.priority,due_date:S(e.due_date),start_date:S(e.start_date),assignee_ids:e.assignees?e.assignees.map(e=>e.id):e.assignee?[e.assignee.id]:[],tags:e.tags_list.join(", ")})},[e,S]);let z=e=>e?new Date(e).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):"Not set",T=e=>new Date(e).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),D=async()=>{try{let e=e=>{if(!e)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;if(e.includes("T"))return e.split("T")[0];let a=new Date(e);return isNaN(a.getTime())?null:a.toISOString().split("T")[0]},a={...L,tags:L.tags,assignee_ids:L.assignee_ids&&L.assignee_ids.length>0?L.assignee_ids:[],due_date:e(L.due_date),start_date:e(L.start_date)};console.log("Saving task with assignee_ids:",a.assignee_ids),console.log("Saving task with formatted dates:",{due_date:a.due_date,start_date:a.start_date}),await x(a),N(!1)}catch(e){console.error("Failed to save task:",e)}},B=async a=>{b&&await b(e.id,a)},R=(j=e.priority,f.find(e=>e.value===j)||f[1]),$=(y=e.status,u.find(e=>e.value===y)||u[0]),U=!!(w=e.due_date)&&new Date(w)<new Date,I=[{id:"task",label:"Task",icon:i.jsx(s.Z,{style:{width:"16px",height:"16px"}})},{id:"comments",label:"Comments & Files",icon:i.jsx(l,{style:{width:"16px",height:"16px"}})}];return k?i.jsx("input",{type:"text",value:L.name,onChange:e=>Z({...L,name:e.target.value}),className:"form-input",style:{fontSize:"1.5rem",fontWeight:"bold",marginBottom:"1rem"}}):i.jsx("h2",{className:"task-title",children:e.name}),R.icon,R.label,$.icon,$.label,U&&n.Z,d.Z,v&&(()=>F(!0),o.Z),c.Z,I.map(e=>(0,i.jsxs)("button",{onClick:()=>_(e.id),className:`tab-button ${E===e.id?"active":""}`,children:[e.icon,i.jsx("span",{children:e.label})]},e.id)),"task"===E&&(i.Fragment,k?(0,i.jsxs)("div",{className:"edit-form",children:[(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Description"}),i.jsx("textarea",{value:L.description,onChange:e=>Z({...L,description:e.target.value}),className:"form-textarea",placeholder:"Describe what needs to be done..."})]}),(0,i.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(min(200px, 100%), 1fr))",gap:"1rem"},children:[(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Priority"}),i.jsx("select",{value:L.priority,onChange:e=>Z({...L,priority:e.target.value}),className:"form-select",children:f.map(e=>(0,i.jsxs)("option",{value:e.value,children:[e.icon," ",e.label]},e.value))})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Assignees"}),i.jsx("div",{style:{border:"2px solid #e5e7eb",borderRadius:"8px",padding:"0.75rem",background:"#ffffff",minHeight:"100px",maxHeight:"150px",overflowY:"auto"},children:0===a.length?i.jsx("div",{style:{color:"#6b7280",fontStyle:"italic",textAlign:"center",padding:"1rem"},children:"No team members available"}):a.map(e=>(0,i.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.4rem",cursor:"pointer",borderRadius:"4px",transition:"background-color 0.2s ease",marginBottom:"0.2rem"},onMouseOver:e=>e.currentTarget.style.backgroundColor="#f3f4f6",onMouseOut:e=>e.currentTarget.style.backgroundColor="transparent",children:[i.jsx("input",{type:"checkbox",checked:L.assignee_ids.includes(e.id),onChange:a=>{a.target.checked?Z({...L,assignee_ids:[...L.assignee_ids,e.id]}):Z({...L,assignee_ids:L.assignee_ids.filter(a=>a!==e.id)})},style:{marginRight:"0.5rem",accentColor:"#000000"}}),i.jsx("div",{style:{width:"28px",height:"28px",borderRadius:"50%",background:L.assignee_ids.includes(e.id)?"#000000":"#f3f4f6",color:L.assignee_ids.includes(e.id)?"#ffffff":"#000000",border:"2px solid #000000",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.8rem",fontWeight:"600"},children:e.name.charAt(0).toUpperCase()}),i.jsx("span",{style:{fontSize:"0.85rem",fontWeight:"500",color:L.assignee_ids.includes(e.id)?"#000000":"#374151"},children:e.name})]},e.id))}),L.assignee_ids.length>0&&i.jsx("div",{style:{marginTop:"0.5rem",padding:"0.4rem",background:"#f0f9ff",border:"1px solid #3b82f6",borderRadius:"4px",fontSize:"0.8rem",color:"#1e40af"},children:(0,i.jsxs)("strong",{children:[L.assignee_ids.length," assignee",1===L.assignee_ids.length?"":"s"," selected"]})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Created by"}),i.jsx("input",{type:"text",value:e.created_by?.name||"Unknown User",className:"form-input",disabled:!0,style:{backgroundColor:"#f9fafb",color:"#6b7280",cursor:"not-allowed"}})]})]}),(0,i.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(min(250px, 100%), 1fr))",gap:"1rem"},children:[(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Start Date"}),i.jsx("input",{type:"date",value:L.start_date,onChange:e=>Z({...L,start_date:e.target.value}),className:"form-input"})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Due Date"}),i.jsx("input",{type:"date",value:L.due_date,onChange:e=>Z({...L,due_date:e.target.value}),className:"form-input"})]})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Tags"}),i.jsx("input",{type:"text",value:L.tags,onChange:e=>Z({...L,tags:e.target.value}),className:"form-input",placeholder:"frontend, urgent, bug (comma-separated)"})]}),(0,i.jsxs)("div",{className:"form-actions",children:[i.jsx("button",{onClick:()=>N(!1),className:"btn btn-secondary",children:"Cancel"}),i.jsx("button",{onClick:D,className:"btn btn-primary",children:"Save Changes"})]})]}):(0,i.jsxs)(i.Fragment,{children:[i.jsx("div",{className:`task-description ${e.description?"":"empty"}`,children:e.description||"No description provided."}),(0,i.jsxs)("div",{className:"task-details-grid",children:[(0,i.jsxs)("div",{className:"task-detail-item",children:[i.jsx(m.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"task-detail-content",children:[i.jsx("div",{className:"task-detail-label",children:e.assignees&&e.assignees.length>1?"Assignees":"Assignee"}),i.jsx("div",{className:"task-detail-value",children:e.assignees&&e.assignees.length>0?i.jsx("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap"},children:e.assignees.map((a,t)=>(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"0.25rem"},children:[i.jsx("div",{style:{width:"24px",height:"24px",borderRadius:"50%",background:"#000000",color:"#ffffff",border:"2px solid #ffffff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",fontWeight:"600",marginLeft:t>0?"-8px":"0",zIndex:e.assignees.length-t,position:"relative"},children:a.name.charAt(0).toUpperCase()}),i.jsx("span",{style:{fontSize:"0.875rem",fontWeight:"500"},children:a.name}),t<e.assignees.length-1&&e.assignees.length>1&&i.jsx("span",{style:{color:"#6b7280"},children:","})]},a.id))}):e.assignee?e.assignee.name:"Unassigned"})]})]}),(0,i.jsxs)("div",{className:"task-detail-item",children:[i.jsx(g.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"task-detail-content",children:[i.jsx("div",{className:"task-detail-label",children:"Due Date"}),i.jsx("div",{className:"task-detail-value",children:z(e.due_date)})]})]}),(0,i.jsxs)("div",{className:"task-detail-item",children:[i.jsx(p.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"task-detail-content",children:[i.jsx("div",{className:"task-detail-label",children:"Start Date"}),i.jsx("div",{className:"task-detail-value",children:z(e.start_date)})]})]}),(0,i.jsxs)("div",{className:"task-detail-item",children:[i.jsx(p.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"task-detail-content",children:[i.jsx("div",{className:"task-detail-label",children:"Estimated Hours"}),i.jsx("div",{className:"task-detail-value",children:e.estimated_hours?`${e.estimated_hours}h`:"Not set"})]})]}),e.tags_list&&e.tags_list.length>0&&(0,i.jsxs)("div",{className:"task-detail-item",children:[i.jsx(h.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"task-detail-content",children:[i.jsx("div",{className:"task-detail-label",children:"Tags"}),i.jsx("div",{className:"task-detail-value",children:e.tags_list.join(", ")})]})]}),(0,i.jsxs)("div",{className:"task-detail-item",children:[i.jsx(m.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"task-detail-content",children:[i.jsx("div",{className:"task-detail-label",children:"Created by"}),i.jsx("div",{className:"task-detail-value",children:e.created_by?.name||"Unknown User"})]})]}),(0,i.jsxs)("div",{className:"task-detail-item",children:[i.jsx(g.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"task-detail-content",children:[i.jsx("div",{className:"task-detail-label",children:"Created"}),i.jsx("div",{className:"task-detail-value",children:T(e.created_at)})]})]}),(0,i.jsxs)("div",{className:"task-detail-item",children:[i.jsx(g.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"task-detail-content",children:[i.jsx("div",{className:"task-detail-label",children:"Last Updated"}),i.jsx("div",{className:"task-detail-value",children:T(e.updated_at)})]})]})]}),!k&&b&&(0,i.jsxs)("div",{className:"task-status-actions-inline",children:[i.jsx("div",{className:"status-actions-title",children:"Change Status"}),i.jsx("div",{className:"status-buttons",children:u.map(a=>(0,i.jsxs)("button",{onClick:()=>B(a.value),className:`status-btn ${a.value===e.status?"current":""}`,disabled:a.value===e.status,children:[i.jsx("span",{children:a.icon}),i.jsx("span",{children:a.label})]},a.value))})]})]})),C&&(()=>F(!1),e.name),null}},4448:(e,a,t)=>{t.d(a,{Z:()=>s});var i=t(4218);let r=i.forwardRef(function({title:e,titleId:a,...t},r){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},t),e?i.createElement("title",{id:a},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m4.5 12.75 6 6 9-13.5"}))}),s=r},789:(e,a,t)=>{t.d(a,{Z:()=>s});var i=t(4218);let r=i.forwardRef(function({title:e,titleId:a,...t},r){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},t),e?i.createElement("title",{id:a},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 19.5 8.25 12l7.5-7.5"}))}),s=r},7689:(e,a,t)=>{t.d(a,{Z:()=>s});var i=t(4218);let r=i.forwardRef(function({title:e,titleId:a,...t},r){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},t),e?i.createElement("title",{id:a},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m8.25 4.5 7.5 7.5-7.5 7.5"}))}),s=r},9866:(e,a,t)=>{t.d(a,{Z:()=>s});var i=t(4218);let r=i.forwardRef(function({title:e,titleId:a,...t},r){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},t),e?i.createElement("title",{id:a},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"}))}),s=r},485:(e,a,t)=>{t.d(a,{Z:()=>s});var i=t(4218);let r=i.forwardRef(function({title:e,titleId:a,...t},r){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},t),e?i.createElement("title",{id:a},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"}))}),s=r},2150:(e,a,t)=>{t.d(a,{Z:()=>s});var i=t(4218);let r=i.forwardRef(function({title:e,titleId:a,...t},r){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},t),e?i.createElement("title",{id:a},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"}))}),s=r},2432:(e,a,t)=>{t.d(a,{Z:()=>s});var i=t(4218);let r=i.forwardRef(function({title:e,titleId:a,...t},r){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},t),e?i.createElement("title",{id:a},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"}))}),s=r},856:(e,a,t)=>{t.d(a,{Z:()=>s});var i=t(4218);let r=i.forwardRef(function({title:e,titleId:a,...t},r){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},t),e?i.createElement("title",{id:a},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"}))}),s=r},9402:(e,a,t)=>{t.d(a,{Z:()=>s});var i=t(4218);let r=i.forwardRef(function({title:e,titleId:a,...t},r){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},t),e?i.createElement("title",{id:a},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"}),i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6 6h.008v.008H6V6Z"}))}),s=r},1888:(e,a,t)=>{t.d(a,{Z:()=>s});var i=t(4218);let r=i.forwardRef(function({title:e,titleId:a,...t},r){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":a},t),e?i.createElement("title",{id:a},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"}))}),s=r}};