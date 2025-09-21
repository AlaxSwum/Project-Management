(()=>{var e={};e.id=3237,e.ids=[3237],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},5403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},4749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},4300:e=>{"use strict";e.exports=require("buffer")},6113:e=>{"use strict";e.exports=require("crypto")},2361:e=>{"use strict";e.exports=require("events")},3685:e=>{"use strict";e.exports=require("http")},5687:e=>{"use strict";e.exports=require("https")},1808:e=>{"use strict";e.exports=require("net")},1017:e=>{"use strict";e.exports=require("path")},5477:e=>{"use strict";e.exports=require("punycode")},2781:e=>{"use strict";e.exports=require("stream")},4404:e=>{"use strict";e.exports=require("tls")},7310:e=>{"use strict";e.exports=require("url")},9796:e=>{"use strict";e.exports=require("zlib")},7100:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>s.a,__next_app__:()=>p,originalPathname:()=>m,pages:()=>c,routeModule:()=>f,tree:()=>d});var a=r(7096),i=r(6132),o=r(7284),s=r.n(o),n=r(2564),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);r.d(t,l);let d=["",{children:["my-tasks",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,1702)),"/Users/swumpyaesone/Documents/project_management/frontend/src/app/my-tasks/page.tsx"]}]},{metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,3881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(r.bind(r,2540)),"/Users/swumpyaesone/Documents/project_management/frontend/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,9291,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,3881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],c=["/Users/swumpyaesone/Documents/project_management/frontend/src/app/my-tasks/page.tsx"],m="/my-tasks/page",p={require:r,loadChunk:()=>Promise.resolve()},f=new a.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/my-tasks/page",pathname:"/my-tasks",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},5521:(e,t,r)=>{Promise.resolve().then(r.bind(r,2847))},2847:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>D});var a=r(3854),i=r(4218),o=r(1018),s=r(6837),n=r(4937),l=r(1685),d=r(4063),c=r(199),m=r(4791),p=r(2432),f=r(1843),g=r(9072),u=r(9402),x=r(789),h=r(7689),b=r(9077),y=r(2591),w=r(1998);let v=[{value:"todo",label:"To Do",color:"#f3f4f6",icon:""},{value:"in_progress",label:"In Progress",color:"#dbeafe",icon:""},{value:"review",label:"Review",color:"#fef3c7",icon:""},{value:"done",label:"Done",color:"#d1fae5",icon:""}],k=[{value:"low",label:"Low",color:"#10b981",icon:""},{value:"medium",label:"Medium",color:"#f59e0b",icon:""},{value:"high",label:"High",color:"#ef4444",icon:""},{value:"urgent",label:"Urgent",color:"#dc2626",icon:""}],j=[{value:"all",label:"All Tasks"},{value:"todo",label:"To Do"},{value:"in_progress",label:"In Progress"},{value:"in_review",label:"In Review"},{value:"done",label:"Done"},{value:"overdue",label:"Overdue"},{value:"today",label:"Due Today"},{value:"this_week",label:"Due This Week"}];function D(){let e=(0,o.useRouter)(),{user:t,isAuthenticated:r,isLoading:D}=(0,s.useAuth)(),[C,z]=(0,i.useState)([]),[S,T]=(0,i.useState)([]),[F,N]=(0,i.useState)([]),[_,M]=(0,i.useState)([]),[Y,L]=(0,i.useState)(!0),[W,E]=(0,i.useState)(""),[P,B]=(0,i.useState)(""),[R,Z]=(0,i.useState)("all"),[I,q]=(0,i.useState)("all"),[O,$]=(0,i.useState)(null),[A,H]=(0,i.useState)(!1),[V,U]=(0,i.useState)([]),[G,J]=(0,i.useState)([]),[X,K]=(0,i.useState)(""),[Q,ee]=(0,i.useState)(!1),[et,er]=(0,i.useState)(!1),[ea,ei]=(0,i.useState)(null),[eo,es]=(0,i.useState)(!1),[en,el]=(0,i.useState)("details"),[ed,ec]=(0,i.useState)(!1);(0,i.useEffect)(()=>{let e=()=>{ec(window.innerWidth<768)};return e(),window.addEventListener("resize",e),()=>window.removeEventListener("resize",e)},[]);let[em,ep]=(0,i.useState)("list"),[ef,eg]=(0,i.useState)(new Date),eu=e=>new Date(e.getFullYear(),e.getMonth()+1,0).getDate(),ex=e=>new Date(e.getFullYear(),e.getMonth(),1).getDay(),eh=()=>{eg(new Date(ef.getFullYear(),ef.getMonth()-1))},eb=()=>{eg(new Date(ef.getFullYear(),ef.getMonth()+1))},ey=e=>{let t=e.toISOString().split("T")[0];return S.filter(e=>{if(!e.due_date)return!1;let r=new Date(e.due_date).toISOString().split("T")[0];return r===t})};(0,i.useEffect)(()=>{if(!D){if(!r){e.push("/login");return}ew(),ev(),ek()}},[r,D,e]),(0,i.useEffect)(()=>{ej()},[C,P,R,I]);let ew=async()=>{try{let e=await n.OV.getUserTasks();z(e)}catch(e){console.error("Failed to fetch tasks:",e),E("Failed to fetch your tasks")}finally{L(!1)}},ev=async()=>{try{let e=await n.B4.getProjects();N(e)}catch(e){console.error("Failed to fetch projects:",e)}},ek=async()=>{try{let e=await n.B4.getUsers();M(e)}catch(e){console.error("Failed to fetch users:",e)}},ej=()=>{let e=[...C];P.trim()&&(e=e.filter(e=>e.name.toLowerCase().includes(P.toLowerCase())||e.description.toLowerCase().includes(P.toLowerCase())||e.project.name.toLowerCase().includes(P.toLowerCase())||e.tags_list.some(e=>e.toLowerCase().includes(P.toLowerCase())))),"overdue"===R?e=e.filter(e=>eF(e.due_date)):"today"===R?e=e.filter(e=>eN(e.due_date)):"this_week"===R?e=e.filter(e=>e_(e.due_date)):"all"!==R&&(e=e.filter(e=>e.status===R)),"all"!==I&&(e=e.filter(e=>e.priority===I)),e.sort((e,t)=>{let r={urgent:0,high:1,medium:2,low:3},a=r[e.priority]??4,i=r[t.priority]??4;if(a!==i)return a-i;if(e.due_date&&t.due_date){let r=new Date(e.due_date).getTime(),a=new Date(t.due_date).getTime();if(r!==a)return r-a}else if(e.due_date&&!t.due_date)return -1;else if(!e.due_date&&t.due_date)return 1;let o=new Date(e.created_at).getTime(),s=new Date(t.created_at).getTime();return o!==s?o-s:e.name.localeCompare(t.name)}),T(e)},eD=async(e,t)=>{try{await n.OV.updateTaskStatus(e,t),z(C.map(r=>r.id===e?{...r,status:t}:r)),O&&O.id===e&&$({...O,status:t})}catch(e){E("Failed to update task status")}},eC=async e=>{ee(!0),er(!0);try{let[t,r]=await Promise.all([n.OV.getTaskComments(e),n.OV.getTaskAttachments(e).catch(()=>[])]);U(t||[]),J(r||[])}catch(e){console.error("Failed to fetch task details:",e)}finally{ee(!1),er(!1)}},ez=async e=>{if(O)try{let t=await n.OV.updateTask(O.id,e);z(C.map(e=>e.id===O.id?t:e)),$(t),E("")}catch(e){throw E("Failed to update task"),e}},eS=async e=>{$(e),H(!0),await eC(e.id)},eT=async e=>{try{await n.OV.deleteTask(e),z(C.filter(t=>t.id!==e)),E("")}catch(e){throw E("Failed to delete task"),e}},eF=e=>{if(!e)return!1;let t=new Date;return t.setHours(0,0,0,0),new Date(e)<t},eN=e=>{if(!e)return!1;let t=new Date,r=new Date(e);return t.toDateString()===r.toDateString()},e_=e=>{if(!e)return!1;let t=new Date,r=new Date(e),a=new Date;return a.setDate(t.getDate()+7),r>=t&&r<=a},eM=e=>{if(!e)return null;let t=new Date,r=new Date(e),a=r.getTime()-t.getTime();return Math.ceil(a/864e5)},eY=e=>{if(!e)return"";let t=new Date(e);return t.toLocaleDateString("en-US",{month:"short",day:"numeric",year:t.getFullYear()!==new Date().getFullYear()?"numeric":void 0})},eL=e=>k.find(t=>t.value===e)||k[1],eW=e=>v.find(t=>t.value===e)||v[0],eE=(()=>{let e=C.length,t=C.filter(e=>"done"===e.status).length,r=C.filter(e=>eF(e.due_date)).length,a=C.filter(e=>eN(e.due_date)).length;return{total:e,completed:t,overdue:r,dueToday:a}})();return D?a.jsx("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F5F5ED"},children:a.jsx("div",{style:{width:"32px",height:"32px",border:"3px solid #C483D9",borderTop:"3px solid #5884FD",borderRadius:"50%",animation:"spin 1s linear infinite"}})}):r?Y?a.jsx("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F5F5ED"},children:a.jsx("div",{style:{width:"32px",height:"32px",border:"3px solid #C483D9",borderTop:"3px solid #5884FD",borderRadius:"50%",animation:"spin 1s linear infinite"}})}):(0,a.jsxs)("div",{children:[a.jsx(w.Z,{title:"My Tasks",isMobile:ed}),a.jsx("style",{dangerouslySetInnerHTML:{__html:`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #F5F5ED;
          }
          .my-tasks-container {
            min-height: 100vh;
            display: flex;
            background: #F5F5ED;
          }
          .main-content {
            flex: 1;
            margin-left: ${ed?"0":"256px"};
            background: transparent;
            padding-top: ${ed?"70px":"0"};
            padding-left: ${ed?"12px":"0"};
            padding-right: ${ed?"12px":"0"};
          }
          .header {
            background: transparent;
            padding: 2rem;
            margin-bottom: 3rem;
          }
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
          }
          .header-title {
            font-size: 2.5rem;
            font-weight: 300;
            color: #1a1a1a;
            margin: 0;
            letter-spacing: -0.02em;
          }
          .header-subtitle {
            color: #666666;
            font-size: 1.1rem;
            font-weight: 400;
            line-height: 1.5;
            margin: 0.5rem 0 0 0;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 0;
          }
          .stat-card {
            background: #ffffff;
            border: 1px solid #e8e8e8;
            border-radius: 16px;
            padding: 1.5rem;
            text-align: left;
            transition: all 0.2s ease;
            box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
          }
          .stat-card:hover {
            transform: translateY(-2px);
          }
          .stat-number {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
            line-height: 1;
          }
          .stat-label {
            font-size: 0.875rem;
            font-weight: 500;
            margin: 0;
          }
          .filters-section {
            background: #ffffff;
            border: 1px solid #e8e8e8;
            border-radius: 16px;
            padding: 2rem;
            margin: 0 2rem 2rem 2rem;
            box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
          }
          .filters-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 2rem;
            align-items: end;
          }
          .filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .filter-label {
            font-weight: 600;
            color: #1a1a1a;
            font-size: 1rem;
            letter-spacing: -0.01em;
            margin-bottom: 0.75rem;
            display: block;
          }
          .search-input {
            width: 100%;
            padding: 0.9rem 3rem 0.9rem 1rem;
            border: 2px solid #e8e8e8;
            border-radius: 16px;
            font-size: 0.95rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #1a1a1a;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 500;
            letter-spacing: -0.01em;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          }
          .search-input:hover {
            border-color: #C483D9;
            background: #fafafa;
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(196, 131, 217, 0.15);
          }
          .search-input:focus {
            outline: none;
            border-color: #5884FD;
            background: #ffffff;
            box-shadow: 0 0 0 4px rgba(88, 132, 253, 0.1), 0 4px 16px rgba(88, 132, 253, 0.2);
            transform: translateY(-2px);
          }
          .search-input:active {
            transform: translateY(0);
          }
          .filter-select {
            width: 100%;
            padding: 0.9rem 1rem;
            border: 2px solid #e8e8e8;
            border-radius: 16px;
            font-size: 0.95rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #1a1a1a;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 500;
            letter-spacing: -0.01em;
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 1rem center;
            background-repeat: no-repeat;
            background-size: 1rem;
            padding-right: 3rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          }
          .filter-select:hover {
            border-color: #C483D9;
            background: #fafafa;
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(196, 131, 217, 0.15);
          }
          .filter-select:focus {
            outline: none;
            border-color: #5884FD;
            background: #ffffff;
            box-shadow: 0 0 0 4px rgba(88, 132, 253, 0.1), 0 4px 16px rgba(88, 132, 253, 0.2);
            transform: translateY(-2px);
          }
          .filter-select:active {
            transform: translateY(0);
          }
          .tasks-section {
            padding: 0 2rem 2rem 2rem;
          }
          .tasks-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .task-item {
            background: #ffffff;
            border: 1px solid #e8e8e8;
            border-radius: 16px;
            padding: 2rem;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
          }
          .task-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border-color: #C483D9;
          }
          .task-item.overdue {
            border-color: #ef4444;
            background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
          }
          .task-item.urgent {
            border-color: #f59e0b;
            background: linear-gradient(135deg, #ffffff 0%, #fff7ed 100%);
          }
          .task-header {
            display: flex;
            align-items: start;
            justify-content: space-between;
            margin-bottom: 1rem;
          }
          .task-title-section {
            flex: 1;
          }
          .task-title {
            font-weight: 500;
            color: #1a1a1a;
            font-size: 1.2rem;
            line-height: 1.4;
            margin-bottom: 0.5rem;
            letter-spacing: -0.01em;
          }
          .task-project {
            font-size: 0.85rem;
            color: #666666;
            font-weight: 500;
            margin: 0 0.5rem;
          }
          .task-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .priority-badge {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            border: 1px solid;
          }
          .status-badge {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            border: 1px solid;
          }
          .task-description {
            font-size: 0.9rem;
            color: #6b7280;
            margin-bottom: 1rem;
            line-height: 1.5;
          }
          .task-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .task-meta-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8rem;
            color: #6b7280;
            background: #f9fafb;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          .task-meta-item.overdue {
            background: #fef2f2;
            border-color: #fecaca;
            color: #dc2626;
            animation: pulse 2s infinite;
          }
          .task-actions-row {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }
          .status-btn {
            padding: 0.5rem 1rem;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s ease;
            background: #ffffff;
            color: #666666;
            font-weight: 500;
          }
          .status-btn:hover {
            background: #5884FD;
            color: #ffffff;
            border-color: #5884FD;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(88, 132, 253, 0.3);
          }
          .view-btn {
            padding: 0.5rem;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background: #ffffff;
            color: #666666;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .view-btn:hover {
            background: #5884FD;
            color: #ffffff;
            border-color: #5884FD;
            transform: translateY(-1px);
          }
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4rem 2rem;
            text-align: center;
            color: #9ca3af;
          }
          .empty-state-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            opacity: 0.5;
          }
          .empty-state-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }
          .empty-state-text {
            font-size: 0.95rem;
            line-height: 1.5;
          }
          .error-message {
            background: #ffffff;
            border: 1px solid #F87239;
            color: #F87239;
            padding: 1rem;
            border-radius: 12px;
            margin: 0 2rem 2rem 2rem;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(248, 114, 57, 0.1);
          }
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 50;
            animation: fadeIn 0.3s ease-out;
          }
          .modal-content {
            background: #ffffff;
            border: 2px solid #000000;
            padding: 0;
            width: 100%;
            max-width: 900px;
            border-radius: 12px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            animation: slideIn 0.3s ease-out;
            display: flex;
            flex-direction: column;
          }
          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem 2rem;
            border-bottom: 2px solid #f3f4f6;
            flex-shrink: 0;
          }
          .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 2rem;
          }
          .modal-tabs {
            display: flex;
            border-bottom: 2px solid #f3f4f6;
            margin-bottom: 1.5rem;
          }
          .modal-tab {
            padding: 0.75rem 1.5rem;
            border: none;
            background: none;
            cursor: pointer;
            font-weight: 500;
            color: #666666;
            border-bottom: 2px solid transparent;
            transition: all 0.2s ease;
          }
          .modal-tab.active {
            color: #000000;
            border-bottom-color: #000000;
          }
          .modal-tab:hover {
            color: #000000;
          }
          .tab-content {
            display: none;
          }
          .tab-content.active {
            display: block;
          }
          .comments-section {
            max-height: 400px;
            overflow-y: auto;
            margin-bottom: 1rem;
          }
          .comment-item {
            display: flex;
            gap: 0.75rem;
            margin-bottom: 1rem;
            padding: 1rem;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .comment-avatar {
            width: 32px;
            height: 32px;
            background: #e5e7eb;
            border: 1px solid #000000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: 600;
            color: #000000;
            flex-shrink: 0;
          }
          .comment-content {
            flex: 1;
          }
          .comment-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
          }
          .comment-author {
            font-weight: 600;
            color: #000000;
            font-size: 0.9rem;
          }
          .comment-date {
            font-size: 0.75rem;
            color: #666666;
          }
          .comment-text {
            color: #374151;
            line-height: 1.5;
            font-size: 0.9rem;
          }
          .comment-form {
            display: flex;
            gap: 0.75rem;
            align-items: end;
          }
          .comment-input {
            flex: 1;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.9rem;
            resize: vertical;
            min-height: 80px;
            font-family: inherit;
          }
          .comment-input:focus {
            outline: none;
            border-color: #000000;
          }
          .comment-btn {
            padding: 0.75rem 1.5rem;
            background: #000000;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
          }
          .comment-btn:hover {
            background: #333333;
          }
          .attachments-section {
            margin-bottom: 1.5rem;
          }
          .attachment-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            margin-bottom: 0.5rem;
          }
          .attachment-icon {
            width: 32px;
            height: 32px;
            background: #e5e7eb;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666666;
          }
          .attachment-info {
            flex: 1;
          }
          .attachment-name {
            font-weight: 500;
            color: #000000;
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
          }
          .attachment-meta {
            font-size: 0.75rem;
            color: #666666;
          }
          .attachment-download {
            padding: 0.5rem;
            background: none;
            border: 1px solid #000000;
            border-radius: 4px;
            cursor: pointer;
            color: #000000;
            transition: all 0.2s ease;
          }
          .attachment-download:hover {
            background: #f3f4f6;
          }
          .file-upload-section {
            border: 2px dashed #e5e7eb;
            border-radius: 8px;
            padding: 1.5rem;
            text-align: center;
            transition: all 0.2s ease;
          }
          .file-upload-section:hover {
            border-color: #000000;
            background: #f9fafb;
          }
          .file-upload-input {
            display: none;
          }
          .file-upload-btn {
            padding: 0.75rem 1.5rem;
            background: #ffffff;
            color: #000000;
            border: 2px solid #000000;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }
          .file-upload-btn:hover {
            background: #f3f4f6;
          }
          .selected-file {
            margin-top: 1rem;
            padding: 0.75rem;
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .upload-btn {
            padding: 0.5rem 1rem;
            background: #000000;
            color: #ffffff;
            border: none;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .upload-btn:hover {
            background: #333333;
          }
          .upload-btn:disabled {
            background: #cccccc;
            cursor: not-allowed;
          }
          
          /* Calendar View Styles */
          .calendar-day-cell {
            position: relative;
            transition: all 0.2s ease;
          }
          .calendar-day-cell:hover {
            background: #f8fafc !important;
          }
          .calendar-grid {
            border-collapse: separate;
            border-spacing: 1px;
          }
          .loading-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid #ffffff;
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          .modal-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: #000000;
            margin: 0;
          }
          .close-btn {
            background: none;
            border: none;
            padding: 0.5rem;
            border-radius: 4px;
            cursor: pointer;
            color: #666666;
            transition: all 0.2s ease;
          }
          .close-btn:hover {
            background: #f3f4f6;
            color: #000000;
          }
          /* Tablet styles */
          @media (max-width: 1024px) {
            .main-content {
              margin-left: 0;
            }
            .filters-grid {
              grid-template-columns: 1fr 1fr;
            }
            .header {
              padding: 1rem 1.5rem;
            }
            .filters-section {
              margin: 1.5rem;
              padding: 1.25rem;
            }
            .tasks-section {
              padding: 0 1.5rem 1.5rem 1.5rem;
            }
          }

          /* Mobile styles */
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
            }
            .header {
              padding: 1rem;
              position: relative;
              border-bottom: 1px solid #e5e7eb;
            }
            .header-content {
              flex-direction: column;
              gap: 1rem;
              align-items: stretch;
            }
            .header-title {
              font-size: 1.5rem;
            }
            .header-subtitle {
              font-size: 0.9rem;
            }
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 0.75rem;
            }
            .stat-card {
              padding: 0.75rem;
            }
            .stat-number {
              font-size: 1.25rem;
            }
            .stat-label {
              font-size: 0.75rem;
            }
            .filters-section {
              margin: 1rem;
              padding: 1rem;
              border-radius: 8px;
            }
            .filters-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            .search-input {
              padding: 0.875rem 3rem 0.875rem 1rem;
              font-size: 1rem;
              border-radius: 12px;
            }
            .filter-select {
              padding: 0.875rem 3rem 0.875rem 1rem;
              font-size: 1rem;
              border-radius: 12px;
            }
            .tasks-section {
              padding: 0 1rem 1rem 1rem;
            }
            .task-item {
              padding: 1rem;
              border-radius: 8px;
            }
            .task-header {
              flex-direction: column;
              align-items: start;
              gap: 0.75rem;
            }
            .task-title {
              font-size: 1rem;
              margin-bottom: 0.25rem;
            }
            .task-project {
              font-size: 0.8rem;
            }
            .task-actions {
              align-self: stretch;
              justify-content: flex-start;
              flex-wrap: wrap;
              gap: 0.5rem;
            }
            .priority-badge, .status-badge {
              font-size: 0.7rem;
              padding: 0.25rem 0.5rem;
            }
            .task-description {
              font-size: 0.85rem;
              margin-bottom: 0.75rem;
            }
            .task-meta {
              gap: 0.5rem;
              margin-bottom: 0.75rem;
            }
            .task-meta-item {
              font-size: 0.75rem;
              padding: 0.375rem 0.5rem;
            }
            .task-actions-row {
              gap: 0.375rem;
            }
            .status-btn {
              padding: 0.5rem 0.75rem;
              font-size: 0.75rem;
              flex: 1;
              min-width: fit-content;
            }
            .view-btn {
              padding: 0.5rem;
              min-width: 40px;
              height: 40px;
            }
            .empty-state {
              padding: 2rem 1rem;
            }
            .empty-state-icon {
              font-size: 3rem;
            }
            .empty-state-title {
              font-size: 1.1rem;
            }
            .empty-state-text {
              font-size: 0.9rem;
            }
            .error-message {
              margin: 1rem;
              padding: 0.875rem;
              font-size: 0.9rem;
            }
          }

          /* Small mobile styles */
          @media (max-width: 480px) {
            .header {
              padding: 0.75rem;
            }
            .header-title {
              font-size: 1.375rem;
            }
            .stats-grid {
              gap: 0.5rem;
            }
            .stat-card {
              padding: 0.625rem;
            }
            .stat-number {
              font-size: 1.125rem;
            }
            .filters-section {
              margin: 0.75rem;
              padding: 0.875rem;
            }
            .tasks-section {
              padding: 0 0.75rem 0.75rem 0.75rem;
            }
            .task-item {
              padding: 0.875rem;
            }
            .task-actions {
              gap: 0.375rem;
            }
            .priority-badge, .status-badge {
              font-size: 0.65rem;
              padding: 0.2rem 0.4rem;
            }
            .task-actions-row {
              flex-direction: column;
            }
            .status-btn {
              width: 100%;
              text-align: center;
            }
            .view-btn {
              align-self: flex-end;
              position: absolute;
              top: 0.875rem;
              right: 0.875rem;
            }
            .task-header {
              position: relative;
              padding-right: 3rem;
            }
          }

          /* Mobile modal styles */
          @media (max-width: 768px) {
            .modal-overlay {
              padding: 0.5rem;
              align-items: flex-end;
            }
            .modal-content {
              max-width: 100%;
              max-height: 95vh;
              border-radius: 12px 12px 0 0;
              margin-bottom: 0;
            }
            .modal-header {
              padding: 1rem 1.25rem;
            }
            .modal-title {
              font-size: 1.25rem;
            }
            .modal-body {
              padding: 1.25rem;
            }
            .modal-tabs {
              margin-bottom: 1rem;
              overflow-x: auto;
              white-space: nowrap;
            }
            .modal-tab {
              padding: 0.625rem 1rem;
              font-size: 0.9rem;
            }
            .comment-form {
              flex-direction: column;
              gap: 0.75rem;
            }
            .comment-input {
              min-height: 70px;
              font-size: 1rem;
            }
            .comment-btn {
              align-self: stretch;
              padding: 0.875rem;
            }
            .file-upload-section {
              padding: 1rem;
            }
            .file-upload-btn {
              padding: 0.875rem 1.25rem;
              width: 100%;
              justify-content: center;
            }
            .selected-file {
              flex-direction: column;
              gap: 0.75rem;
              text-align: center;
            }
            .upload-btn {
              align-self: stretch;
              justify-content: center;
              padding: 0.75rem;
            }
            .attachment-item {
              padding: 0.875rem;
            }
            .comment-item {
              padding: 0.875rem;
            }
            .comment-avatar {
              width: 28px;
              height: 28px;
              font-size: 0.75rem;
            }
          }

          /* Landscape mobile */
          @media (max-width: 896px) and (orientation: landscape) {
            .modal-overlay {
              align-items: center;
            }
            .modal-content {
              max-height: 90vh;
              border-radius: 12px;
            }
          }
        `}}),(0,a.jsxs)("div",{className:"my-tasks-container",children:[!ed&&a.jsx(b.Z,{projects:F,onCreateProject:()=>{}}),(0,a.jsxs)("div",{className:"main-content",children:[(0,a.jsxs)("header",{className:"header",children:[(0,a.jsxs)("div",{className:"header-content",children:[(0,a.jsxs)("div",{children:[a.jsx("h1",{className:"header-title",children:"My Tasks"}),a.jsx("p",{className:"header-subtitle",children:"Manage all your assigned tasks"})]}),(0,a.jsxs)("div",{style:{display:"flex",gap:"0.5rem"},children:[(0,a.jsxs)("button",{onClick:()=>ep("list"),style:{padding:"0.75rem 1.25rem",background:"list"===em?"#5884FD":"#ffffff",color:"list"===em?"#ffffff":"#666666",border:"2px solid #e8e8e8",borderRadius:"12px",fontSize:"0.9rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.5rem",transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",letterSpacing:"-0.01em",boxShadow:"list"===em?"0 4px 12px rgba(88, 132, 253, 0.3)":"0 2px 8px rgba(0, 0, 0, 0.04)"},onMouseEnter:e=>{"list"!==em&&(e.currentTarget.style.borderColor="#C483D9",e.currentTarget.style.transform="translateY(-1px)",e.currentTarget.style.boxShadow="0 4px 16px rgba(196, 131, 217, 0.15)")},onMouseLeave:e=>{"list"!==em&&(e.currentTarget.style.borderColor="#e8e8e8",e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)")},children:[a.jsx(l.Z,{style:{width:"16px",height:"16px"}}),"List"]}),(0,a.jsxs)("button",{onClick:()=>ep("calendar"),style:{padding:"0.75rem 1.25rem",background:"calendar"===em?"#5884FD":"#ffffff",color:"calendar"===em?"#ffffff":"#666666",border:"2px solid #e8e8e8",borderRadius:"12px",fontSize:"0.9rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.5rem",transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",letterSpacing:"-0.01em",boxShadow:"calendar"===em?"0 4px 12px rgba(88, 132, 253, 0.3)":"0 2px 8px rgba(0, 0, 0, 0.04)"},onMouseEnter:e=>{"calendar"!==em&&(e.currentTarget.style.borderColor="#C483D9",e.currentTarget.style.transform="translateY(-1px)",e.currentTarget.style.boxShadow="0 4px 16px rgba(196, 131, 217, 0.15)")},onMouseLeave:e=>{"calendar"!==em&&(e.currentTarget.style.borderColor="#e8e8e8",e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)")},children:[a.jsx(d.Z,{style:{width:"16px",height:"16px"}}),"Calendar"]})]})]}),(0,a.jsxs)("div",{className:"stats-grid",children:[(0,a.jsxs)("div",{className:"stat-card",children:[a.jsx("div",{style:{width:"48px",height:"48px",background:"#f0f0f0",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem"},children:(0,a.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",style:{color:"#FFB333"},children:[a.jsx("rect",{x:"3",y:"3",width:"8",height:"8",rx:"1",stroke:"currentColor",strokeWidth:"2"}),a.jsx("rect",{x:"13",y:"3",width:"8",height:"8",rx:"1",stroke:"currentColor",strokeWidth:"2"}),a.jsx("rect",{x:"3",y:"13",width:"8",height:"8",rx:"1",stroke:"currentColor",strokeWidth:"2"}),a.jsx("rect",{x:"13",y:"13",width:"8",height:"8",rx:"1",stroke:"currentColor",strokeWidth:"2"})]})}),(0,a.jsxs)("div",{children:[a.jsx("div",{className:"stat-number",style:{color:"#FFB333"},children:eE.total}),a.jsx("div",{className:"stat-label",style:{color:"#666666"},children:"Total Tasks"})]})]}),(0,a.jsxs)("div",{className:"stat-card",children:[a.jsx("div",{style:{width:"48px",height:"48px",background:"#f0f0f0",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem"},children:a.jsx(c.Z,{style:{width:"20px",height:"20px",color:"#10B981"}})}),(0,a.jsxs)("div",{children:[a.jsx("div",{className:"stat-number",style:{color:"#10B981"},children:eE.completed}),a.jsx("div",{className:"stat-label",style:{color:"#666666"},children:"Completed"})]})]}),(0,a.jsxs)("div",{className:"stat-card",children:[a.jsx("div",{style:{width:"48px",height:"48px",background:"#f0f0f0",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem"},children:(0,a.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",style:{color:"#F87239"},children:[a.jsx("circle",{cx:"12",cy:"12",r:"9",stroke:"currentColor",strokeWidth:"2"}),a.jsx("path",{d:"M12 7v6",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round"}),a.jsx("path",{d:"M12 17h.01",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round"})]})}),(0,a.jsxs)("div",{children:[a.jsx("div",{className:"stat-number",style:{color:"#F87239"},children:eE.overdue}),a.jsx("div",{className:"stat-label",style:{color:"#666666"},children:"Overdue"})]})]}),(0,a.jsxs)("div",{className:"stat-card",children:[a.jsx("div",{style:{width:"48px",height:"48px",background:"#f0f0f0",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem"},children:a.jsx(m.Z,{style:{width:"20px",height:"20px",color:"#5884FD"}})}),(0,a.jsxs)("div",{children:[a.jsx("div",{className:"stat-number",style:{color:"#5884FD"},children:eE.dueToday}),a.jsx("div",{className:"stat-label",style:{color:"#666666"},children:"Due Today"})]})]})]})]}),W&&a.jsx("div",{className:"error-message",children:W}),a.jsx("div",{className:"filters-section",children:(0,a.jsxs)("div",{className:"filters-grid",children:[(0,a.jsxs)("div",{className:"filter-group",children:[a.jsx("label",{className:"filter-label",children:"Search Tasks"}),(0,a.jsxs)("div",{style:{position:"relative"},children:[a.jsx("input",{type:"text",className:"search-input",placeholder:"Search by name, description, project, or tags...",value:P,onChange:e=>B(e.target.value)}),a.jsx(p.Z,{style:{position:"absolute",right:"1rem",top:"50%",transform:"translateY(-50%)",width:"18px",height:"18px",color:"#666666",pointerEvents:"none"}})]})]}),(0,a.jsxs)("div",{className:"filter-group",children:[a.jsx("label",{className:"filter-label",children:"Filter by Status"}),a.jsx("select",{className:"filter-select",value:R,onChange:e=>Z(e.target.value),children:j.map(e=>a.jsx("option",{value:e.value,children:e.label},e.value))})]}),(0,a.jsxs)("div",{className:"filter-group",children:[a.jsx("label",{className:"filter-label",children:"Filter by Priority"}),(0,a.jsxs)("select",{className:"filter-select",value:I,onChange:e=>q(e.target.value),children:[a.jsx("option",{value:"all",children:"All Priorities"}),k.map(e=>a.jsx("option",{value:e.value,children:e.label},e.value))]})]})]})}),a.jsx("div",{className:"tasks-section",children:"list"===em?0===S.length?(0,a.jsxs)("div",{style:{background:"#ffffff",border:"1px solid #e8e8e8",borderRadius:"16px",padding:"4rem",textAlign:"center",color:"#666666",boxShadow:"0 2px 16px rgba(0, 0, 0, 0.04)"},children:[a.jsx("div",{style:{width:"64px",height:"64px",background:"#f0f0f0",borderRadius:"16px",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 2rem"},children:(0,a.jsxs)("svg",{width:"32",height:"32",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",style:{color:"#999999"},children:[a.jsx("rect",{x:"3",y:"3",width:"8",height:"8",rx:"1",stroke:"currentColor",strokeWidth:"2"}),a.jsx("rect",{x:"13",y:"3",width:"8",height:"8",rx:"1",stroke:"currentColor",strokeWidth:"2"}),a.jsx("rect",{x:"3",y:"13",width:"8",height:"8",rx:"1",stroke:"currentColor",strokeWidth:"2"}),a.jsx("rect",{x:"13",y:"13",width:"8",height:"8",rx:"1",stroke:"currentColor",strokeWidth:"2"})]})}),a.jsx("h3",{style:{fontSize:"1.5rem",fontWeight:"400",margin:"0 0 1rem 0",color:"#1a1a1a",letterSpacing:"-0.01em"},children:"No tasks found"}),a.jsx("p",{style:{fontSize:"1.1rem",margin:"0",lineHeight:"1.5",color:"#999999"},children:0===C.length?"You don't have any assigned tasks yet.":"No tasks match your current filters. Try adjusting your search or filters."})]}):a.jsx("div",{className:"tasks-list",children:S.map(e=>{let t=eL(e.priority),r=eW(e.status),i=eM(e.due_date),o=eF(e.due_date),s=null!==i&&i<=3&&i>0;return(0,a.jsxs)("div",{className:`task-item ${o?"overdue":s?"urgent":""}`,onClick:()=>eS(e),children:[(0,a.jsxs)("div",{className:"task-header",children:[(0,a.jsxs)("div",{className:"task-title-section",children:[a.jsx("h3",{className:"task-title",children:e.name}),a.jsx("p",{className:"task-project",children:e.project.name})]}),(0,a.jsxs)("div",{className:"task-actions",children:[(0,a.jsxs)("div",{className:"priority-badge",style:{backgroundColor:t.color+"20",borderColor:t.color,color:t.color},children:[a.jsx("span",{children:t.icon}),a.jsx("span",{children:t.label})]}),(0,a.jsxs)("div",{className:"status-badge",style:{backgroundColor:r.color,borderColor:"#000000",color:"#000000"},children:[a.jsx("span",{children:r.icon}),a.jsx("span",{children:r.label})]}),a.jsx("button",{className:"view-btn",onClick:t=>{t.stopPropagation(),eS(e)},title:"View Details",children:a.jsx(f.Z,{style:{width:"16px",height:"16px"}})})]})]}),e.description&&a.jsx("p",{className:"task-description",children:e.description}),(0,a.jsxs)("div",{className:"task-meta",children:[e.due_date&&(0,a.jsxs)("div",{className:`task-meta-item ${o?"overdue":""}`,children:[a.jsx(d.Z,{style:{width:"14px",height:"14px"}}),a.jsx("span",{children:eY(e.due_date)}),o&&a.jsx("span",{style:{fontWeight:"bold"},children:"(Overdue)"}),s&&(0,a.jsxs)("span",{style:{fontWeight:"bold"},children:["(",i,"d left)"]})]}),(0,a.jsxs)("div",{className:"task-meta-item",children:[a.jsx(g.Z,{style:{width:"14px",height:"14px"}}),(0,a.jsxs)("span",{children:["Created by ",e.created_by.name]})]}),(e.tags_list||[]).length>0&&(0,a.jsxs)("div",{className:"task-meta-item",children:[a.jsx(u.Z,{style:{width:"14px",height:"14px"}}),a.jsx("span",{children:(e.tags_list||[]).slice(0,3).join(", ")}),(e.tags_list||[]).length>3&&(0,a.jsxs)("span",{style:{fontWeight:"bold"},children:["+",(e.tags_list||[]).length-3," more"]})]})]}),a.jsx("div",{className:"task-actions-row",children:v.filter(t=>t.value!==e.status).map(t=>(0,a.jsxs)("button",{onClick:()=>eD(e.id,t.value),className:"status-btn",title:`Move to ${t.label}`,children:[t.icon," ",t.label]},t.value))})]},e.id)})}):(0,a.jsxs)("div",{style:{background:"#ffffff",border:"1px solid #e8e8e8",borderRadius:"16px",padding:"2rem",boxShadow:"0 2px 16px rgba(0, 0, 0, 0.04)"},children:[(0,a.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2rem",padding:"0 1rem"},children:[a.jsx("button",{onClick:()=>eh(),className:"nav-button",style:{display:"flex",alignItems:"center",justifyContent:"center",width:"44px",height:"44px",background:"#ffffff",border:"2px solid #e8e8e8",borderRadius:"12px",cursor:"pointer",color:"#666666",transition:"all 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.borderColor="#5884FD",e.currentTarget.style.color="#5884FD"},onMouseLeave:e=>{e.currentTarget.style.borderColor="#e8e8e8",e.currentTarget.style.color="#666666"},children:a.jsx(x.Z,{style:{width:"20px",height:"20px"}})}),(0,a.jsxs)("h2",{style:{margin:0,fontSize:"1.5rem",fontWeight:"700",color:"#000000",textAlign:"center",flex:1},children:[["January","February","March","April","May","June","July","August","September","October","November","December"][ef.getMonth()]," ",ef.getFullYear()]}),a.jsx("button",{onClick:()=>eb(),className:"nav-button",style:{display:"flex",alignItems:"center",justifyContent:"center",width:"44px",height:"44px",background:"#ffffff",border:"2px solid #e8e8e8",borderRadius:"12px",cursor:"pointer",color:"#666666",transition:"all 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.borderColor="#5884FD",e.currentTarget.style.color="#5884FD"},onMouseLeave:e=>{e.currentTarget.style.borderColor="#e8e8e8",e.currentTarget.style.color="#666666"},children:a.jsx(h.Z,{style:{width:"20px",height:"20px"}})})]}),(0,a.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",gap:"1px",border:"1px solid #e5e7eb",borderRadius:"8px",overflow:"hidden",background:"#e5e7eb"},children:[["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(e=>a.jsx("div",{style:{padding:"1rem",background:"#f8f9fa",fontWeight:"600",textAlign:"center",fontSize:"0.875rem",color:"#374151"},children:e},e)),(()=>{let e=new Date,t=eu(ef),r=ex(ef),i=[];for(let e=0;e<r;e++){let t=new Date(ef.getFullYear(),ef.getMonth()-1),o=eu(t),s=o-r+e+1,n=new Date(ef.getFullYear(),ef.getMonth()-1,s),l=ey(n);i.push((0,a.jsxs)("div",{className:"calendar-day-cell",style:{minHeight:"120px",padding:"0.75rem",background:"#f8f9fa",border:"1px solid #e5e7eb",color:"#9ca3af",opacity:.5},children:[a.jsx("div",{style:{fontSize:"0.875rem",marginBottom:"0.5rem"},children:s}),l.slice(0,2).map((e,t)=>a.jsx("div",{style:{background:"#e5e7eb",padding:"0.25rem 0.5rem",borderRadius:"4px",fontSize:"0.75rem",marginBottom:"0.25rem",cursor:"pointer"},children:e.name.length>15?`${e.name.substring(0,15)}...`:e.name},e.id))]},`prev-${s}`))}for(let r=1;r<=t;r++){let t=new Date(ef.getFullYear(),ef.getMonth(),r),o=ey(t),s=t.toDateString()===e.toDateString();i.push((0,a.jsxs)("div",{className:"calendar-day-cell",style:{minHeight:"120px",padding:"0.75rem",background:s?"#e3f2fd":"#ffffff",border:s?"2px solid #5884FD":"1px solid #e5e7eb",position:"relative"},children:[a.jsx("div",{style:{fontSize:"0.875rem",fontWeight:s?"600":"400",color:s?"#5884FD":"#1f2937",marginBottom:"0.5rem"},children:r}),o.slice(0,3).map((e,t)=>{let r=eL(e.priority),i=eF(e.due_date);return(0,a.jsxs)("div",{onClick:()=>eS(e),style:{background:i?"#fef2f2":"#f8fafc",border:`1px solid ${i?"#f87171":r.color}`,padding:"0.25rem 0.5rem",borderRadius:"4px",fontSize:"0.75rem",marginBottom:"0.25rem",cursor:"pointer",color:i?"#dc2626":"#1f2937",transition:"all 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.transform="translateY(-1px)",e.currentTarget.style.boxShadow="0 2px 4px rgba(0,0,0,0.1)"},onMouseLeave:e=>{e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="none"},children:[a.jsx("div",{style:{fontWeight:"500"},children:e.name.length>15?`${e.name.substring(0,15)}...`:e.name}),a.jsx("div",{style:{fontSize:"0.7rem",color:"#6b7280",marginTop:"0.125rem"},children:e.project.name})]},e.id)}),o.length>3&&(0,a.jsxs)("div",{style:{fontSize:"0.7rem",color:"#6b7280",fontWeight:"500",marginTop:"0.25rem"},children:["+",o.length-3," more tasks"]})]},r))}let o=7*Math.ceil((r+t)/7)-(r+t);for(let e=1;e<=o;e++){let t=new Date(ef.getFullYear(),ef.getMonth()+1,e),r=ey(t);i.push((0,a.jsxs)("div",{className:"calendar-day-cell",style:{minHeight:"120px",padding:"0.75rem",background:"#f8f9fa",border:"1px solid #e5e7eb",color:"#9ca3af",opacity:.5},children:[a.jsx("div",{style:{fontSize:"0.875rem",marginBottom:"0.5rem"},children:e}),r.slice(0,2).map((e,t)=>a.jsx("div",{style:{background:"#e5e7eb",padding:"0.25rem 0.5rem",borderRadius:"4px",fontSize:"0.75rem",marginBottom:"0.25rem",cursor:"pointer"},children:e.name.length>15?`${e.name.substring(0,15)}...`:e.name},e.id))]},`next-${e}`))}return i})()]})]})}),A&&O&&a.jsx(y.Z,{task:O,users:_,onClose:()=>{H(!1),$(null)},onSave:ez,onStatusChange:eD,onDelete:eT})]})]})]}):null}},1702:(e,t,r)=>{"use strict";r.r(t),r.d(t,{$$typeof:()=>s,__esModule:()=>o,default:()=>l});var a=r(5153);let i=(0,a.createProxy)(String.raw`/Users/swumpyaesone/Documents/project_management/frontend/src/app/my-tasks/page.tsx`),{__esModule:o,$$typeof:s}=i,n=i.default,l=n},1843:(e,t,r)=>{"use strict";r.d(t,{Z:()=>o});var a=r(4218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"}),a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"}))}),o=i},1685:(e,t,r)=>{"use strict";r.d(t,{Z:()=>o});var a=r(4218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"}))}),o=i}};var t=require("../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[3271,1816,1323,7490,5446,8297,6097,1998,4937,5],()=>r(7100));module.exports=a})();