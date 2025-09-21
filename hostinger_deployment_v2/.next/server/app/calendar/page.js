(()=>{var e={};e.id=5329,e.ids=[5329],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},5403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},4749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},4300:e=>{"use strict";e.exports=require("buffer")},6113:e=>{"use strict";e.exports=require("crypto")},2361:e=>{"use strict";e.exports=require("events")},3685:e=>{"use strict";e.exports=require("http")},5687:e=>{"use strict";e.exports=require("https")},1808:e=>{"use strict";e.exports=require("net")},1017:e=>{"use strict";e.exports=require("path")},5477:e=>{"use strict";e.exports=require("punycode")},2781:e=>{"use strict";e.exports=require("stream")},4404:e=>{"use strict";e.exports=require("tls")},7310:e=>{"use strict";e.exports=require("url")},9796:e=>{"use strict";e.exports=require("zlib")},4948:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>o.a,__next_app__:()=>p,originalPathname:()=>c,pages:()=>m,routeModule:()=>f,tree:()=>l});var a=r(7096),i=r(6132),n=r(7284),o=r.n(n),s=r(2564),d={};for(let e in s)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>s[e]);r.d(t,d);let l=["",{children:["calendar",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,1046)),"/Users/swumpyaesone/Documents/project_management/frontend/src/app/calendar/page.tsx"]}]},{metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,3881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(r.bind(r,2540)),"/Users/swumpyaesone/Documents/project_management/frontend/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,9291,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,3881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],m=["/Users/swumpyaesone/Documents/project_management/frontend/src/app/calendar/page.tsx"],c="/calendar/page",p={require:r,loadChunk:()=>Promise.resolve()},f=new a.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/calendar/page",pathname:"/calendar",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},9009:(e,t,r)=>{Promise.resolve().then(r.bind(r,4369))},4369:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>x});var a=r(3854),i=r(4218),n=r(1018),o=r(6837),s=r(4937),d=r(2150),l=r(4791),m=r(4063),c=r(789),p=r(7689),f=r(9072),g=r(9077),h=r(2591),b=r(1998);function x(){let e=(0,n.useRouter)(),{user:t,isAuthenticated:r,isLoading:x}=(0,o.useAuth)(),[u,w]=(0,i.useState)([]),[y,v]=(0,i.useState)([]),[k,j]=(0,i.useState)(!0),[z,F]=(0,i.useState)(null),[N,_]=(0,i.useState)(new Date),[M,C]=(0,i.useState)(!1),[E,S]=(0,i.useState)(null),[P,D]=(0,i.useState)(!1),[B,T]=(0,i.useState)(!1),[A,q]=(0,i.useState)([]),[$,Y]=(0,i.useState)(null);(0,i.useEffect)(()=>{let e=()=>{C(window.innerWidth<768)};return e(),window.addEventListener("resize",e),()=>window.removeEventListener("resize",e)},[]),(0,i.useEffect)(()=>{if(!x){if(!r){e.push("/login");return}I()}},[r,x,e]);let I=async()=>{try{F(null),console.log("Calendar: Fetching data for user:",t?.id);let[e,r]=await Promise.all([s.B4.getProjects(),s.OV.getUserTasks()]);console.log("Calendar: Fetched projects:",e?.length||0),console.log("Calendar: Fetched tasks:",r?.length||0);let a=r.filter(e=>{let r=e.assignees&&e.assignees.some(e=>e.id===t?.id),a=e.assignee?.id===t?.id,i=e.created_by?.id===t?.id;return r||a||i});console.log("Calendar: Filtered user tasks:",a?.length||0);let i=a.map(t=>{let r=e.find(e=>e.id===t.project_id);return{...t,project_name:r?.name||"Unknown Project",project_color:r?.color||"#6b7280",is_important:"urgent"===t.priority||"high"===t.priority,tags_list:t.tags_list||[],assignee:t.assignee||null}});w(e||[]),v(i||[]),console.log("Calendar: Data loaded successfully")}catch(e){console.error("Calendar: Failed to fetch data:",e),F(e instanceof Error?e.message:"Failed to load calendar data")}finally{j(!1)}},L=e=>new Date(e.getFullYear(),e.getMonth()+1,0).getDate(),O=e=>new Date(e.getFullYear(),e.getMonth(),1).getDay(),Z=e=>{let t=e.toISOString().split("T")[0],r=y.filter(e=>{let r=e.due_date?e.due_date.split("T")[0]:null;return r===t});return r.sort((e,t)=>e.is_important&&!t.is_important?-1:!e.is_important&&t.is_important?1:e.name.localeCompare(t.name))},R=e=>{switch(e){case"urgent":case"high":return a.jsx(d.Z,{style:{width:"12px",height:"12px",color:"#000000"}});case"medium":return a.jsx(l.Z,{style:{width:"12px",height:"12px",color:"#000000"}});default:return null}},U=e=>{switch(e){case"done":return"#000000";case"in_progress":return"#6b7280";case"review":return"#9ca3af";default:return"#d1d5db"}},H=e=>!!e&&new Date(e)<new Date,W=async(e,t)=>{try{await s.OV.updateTaskStatus(e,t),v(y.map(r=>r.id===e?{...r,status:t}:r)),E&&E.id===e&&S({...E,status:t})}catch(e){console.error("Failed to update task status:",e)}},G=e=>{P||(S(e),D(!0))},V=()=>{D(!1),S(null)},J=async e=>{try{await s.OV.updateTask(E.id,e),await I()}catch(e){console.error("Failed to update task:",e)}},X=async e=>{try{await s.OV.deleteTask(e),await I(),V()}catch(e){console.error("Failed to delete task:",e)}},K=(e,t)=>{Y(e),q(t),T(!0)};(0,i.useEffect)(()=>{let e=e=>{"Escape"===e.key&&P&&(D(!1),S(null))};if(P)return document.addEventListener("keydown",e),document.body.style.overflow="hidden",()=>{document.removeEventListener("keydown",e),document.body.style.overflow="unset"}},[P]);let Q=new Date,ee=(0,i.useMemo)(()=>L(N),[N]),et=(0,i.useMemo)(()=>O(N),[N]);return x?a.jsx("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#ffffff"},children:a.jsx("div",{style:{width:"32px",height:"32px",border:"3px solid #cccccc",borderTop:"3px solid #000000",borderRadius:"50%",animation:"spin 1s linear infinite"}})}):r?k?a.jsx("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#ffffff"},children:a.jsx("div",{style:{width:"32px",height:"32px",border:"3px solid #cccccc",borderTop:"3px solid #000000",borderRadius:"50%",animation:"spin 1s linear infinite"}})}):z?(0,a.jsxs)("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#ffffff",flexDirection:"column",gap:"1rem",padding:"2rem"},children:[a.jsx(d.Z,{style:{width:"48px",height:"48px",color:"#F87239"}}),a.jsx("h2",{style:{color:"#1F2937",fontSize:"1.5rem",fontWeight:"600",textAlign:"center"},children:"Calendar Error"}),a.jsx("p",{style:{color:"#6B7280",textAlign:"center",maxWidth:"400px"},children:z}),a.jsx("button",{onClick:()=>{F(null),I()},style:{background:"#000000",color:"#ffffff",border:"none",padding:"0.75rem 1.5rem",borderRadius:"8px",fontWeight:"600",cursor:"pointer",transition:"all 0.2s ease"},children:"Try Again"})]}):(0,a.jsxs)("div",{className:"calendar-container",children:[M&&a.jsx(b.Z,{title:"Calendar",isMobile:M}),a.jsx("style",{dangerouslySetInnerHTML:{__html:`
        .calendar-container {
          min-height: 100vh;
          display: flex;
          background: #f8fafc;
          width: 100%;
          ${M?"flex-direction: column;":""}
        }
        

        .main-content {
          flex: 1;
          margin-left: ${M?"0":"280px"};
          background: transparent;
          position: relative;
          z-index: 1;
          padding-top: ${M?"70px":"0"};
          width: ${M?"100vw":"auto"};
          min-height: 100vh;
          ${M?"margin-left: 0 !important; max-width: 100vw; overflow-x: hidden;":""}
        }
        
        .header {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          padding: 2.5rem 2rem 1.5rem 2rem;
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          max-width: ${M?"none":"1200px"};
          margin-left: auto;
          margin-right: auto;
          width: ${M?"100%":"auto"};
        }
        
        .header-controls {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        
        .filter-controls {
          display: flex;
          gap: 1rem;
        }
        
        .filter-btn {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(15px);
          color: #1F2937;
          border: 2px solid rgba(255, 179, 51, 0.3);
          padding: 0.75rem 1.5rem;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          font-size: 0.875rem;
          position: relative;
          overflow: hidden;
        }
        
        .filter-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 179, 51, 0.1), transparent);
          transition: left 0.6s ease;
        }
        
        .filter-btn:hover {
          background: rgba(255, 179, 51, 0.1);
          border-color: #FFB333;
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 25px rgba(255, 179, 51, 0.25);
        }
        
        .filter-btn:hover::before {
          left: 100%;
        }
        
        .filter-btn.active {
          background: linear-gradient(135deg, #FFB333, #FFD480);
          color: #FFFFFF;
          border-color: #FFB333;
          box-shadow: 0 8px 25px rgba(255, 179, 51, 0.35);
        }
        .calendar-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          padding-top: 1.5rem;
          max-width: ${M?"none":"1000px"};
          margin: 0 auto;
          width: ${M?"100%":"auto"};
        }
        
        .calendar-stats .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          background: #FFFFFF;
          padding: 1.25rem 1rem;
          border-radius: 16px;
          border: 1px solid #E5E7EB;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .calendar-stats .stat-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #FFB333;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: #6B7280;
          font-weight: 500;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .stat-value {
          font-size: 1.875rem;
          font-weight: 700;
          color: #1F2937;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          letter-spacing: -0.01em;
        }
        
        .stat-value.overdue {
          color: #F87239;
          font-weight: 700;
        }
        .header-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1F2937;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .calendar-nav {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        .nav-btn {
          background: #FFFFFF;
          color: #1F2937;
          border: 1px solid #E5E7EB;
          padding: 0.75rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .nav-btn:hover {
          background: #F9FAFB;
          border-color: #FFB333;
          color: #FFB333;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .nav-btn:active {
          transform: translateY(0);
        }
        
        .month-year {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1F2937;
          min-width: 200px;
          text-align: center;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          letter-spacing: -0.01em;
        }
        .calendar-content {
          padding: 2rem;
          max-width: ${M?"none":"1200px"};
          margin: 0 auto;
          display: block;
          visibility: visible;
          width: ${M?"100%":"auto"};
        }
        
        .calendar-grid {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .calendar-header-cell {
          padding: 1rem;
          text-align: center;
          font-weight: 600;
          color: #374151;
          border-right: 1px solid #e5e7eb;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        
        .calendar-header-cell:last-child {
          border-right: none;
        }
          .calendar-body {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
          }
        .calendar-cell {
          min-height: 120px;
          padding: 0.75rem;
          border-right: 1px solid #E5E7EB;
          border-bottom: 1px solid #E5E7EB;
          background: #FFFFFF;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .calendar-cell:hover {
          background: #F9FAFB;
        }
        
        .calendar-cell:nth-child(7n) {
          border-right: none;
        }
        
        .calendar-cell.other-month {
          background: #F9FAFB;
          color: #9CA3AF;
        }
        
        .calendar-cell.today {
          background: rgba(255, 179, 51, 0.05);
          border-right: 1px solid #FFB333;
          border-bottom: 1px solid #FFB333;
          position: relative;
        }
        
        .calendar-cell.today::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: #FFB333;
        }
        .day-number {
          font-weight: 600;
          color: #1F2937;
          margin-bottom: 0.5rem;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          font-size: 1rem;
        }
        
        .calendar-cell.other-month .day-number {
          color: #9CA3AF;
        }
        
        .calendar-cell.today .day-number {
          color: #FFB333;
          font-weight: 700;
        }
          .events-container {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
        .task-item {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 0.5rem;
          font-size: 0.75rem;
          margin-bottom: 0.25rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid #E2E8F0;
        }
        
        .task-item:hover {
          background: #F1F5F9;
          border-color: #FFB333;
          border-left-color: #FFB333;
        }
        
        .task-item.important {
          border-left-color: #FFB333;
          background: rgba(255, 179, 51, 0.05);
        }
        
        .task-item.overdue {
          border-left-color: #F87239;
          background: rgba(248, 114, 57, 0.05);
        }
          .task-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.25rem;
          }
        .task-name {
          font-weight: 500;
          color: #1F2937;
          line-height: 1.3;
          flex: 1;
          margin-right: 0.25rem;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
        }
          .task-icons {
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }

          .task-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.65rem;
          }
          .project-name {
            font-weight: 500;
            max-width: 60%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .assignee {
            display: flex;
            align-items: center;
            gap: 0.125rem;
            color: #6b7280;
          }
        .more-tasks {
          background: #EEF2FF;
          border: 1px solid #C7D2FE;
          border-radius: 6px;
          padding: 0.375rem 0.5rem;
          font-size: 0.6875rem;
          color: #5B21B6;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
        }
        
        .more-tasks:hover {
          background: #E0E7FF;
          border-color: #A5B4FC;
        }
          

          
          /* Enhanced Task Modal */
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
            box-sizing: border-box;
          }
          .enhanced-task-modal {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 12px;
            width: 100%;
            max-width: 900px;
            height: 85vh;
            max-height: 85vh;
            min-height: 600px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            overflow: hidden;
          }
          .task-details-section {
            padding: 1.5rem;
            border-bottom: 2px solid #e5e7eb;
            flex-shrink: 0;
            max-height: 60%;
            overflow-y: auto;
          }
          .interaction-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 250px;
            background: #ffffff;
          }
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 1.5rem;
            border-bottom: 2px solid #000000;
            background: #f8fafc;
          }
          .modal-header h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #000000;
            margin: 0;
            flex: 1;
            line-height: 1.3;
          }
          .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            font-weight: bold;
            color: #6b7280;
            cursor: pointer;
            padding: 0;
            margin-left: 1rem;
            transition: all 0.2s ease;
          }
          .close-btn:hover {
            color: #000000;
          }
          /* Tab Navigation */
          .tab-navigation {
            display: flex;
            border-bottom: 2px solid #000000;
            background: #f8fafc;
            flex-shrink: 0;
            z-index: 1;
          }
          .tab-btn {
            flex: 1;
            padding: 1rem 1.5rem;
            background: none;
            border: none;
            border-right: 1px solid #e5e7eb;
            font-weight: 600;
            color: #6b7280;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
            min-height: 60px;
          }
          .tab-btn:last-child {
            border-right: none;
          }
          .tab-btn:hover {
            background: #e5e7eb;
            color: #000000;
          }
          .tab-btn.active {
            background: #ffffff;
            color: #000000;
            border-bottom: 3px solid #000000;
            margin-bottom: -2px;
          }

          /* Comments Section */
          .comments-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }
          .comments-list {
            flex: 1;
            padding: 1.5rem;
            overflow-y: auto;
            max-height: 300px;
          }
          .empty-comments, .empty-files {
            text-align: center;
            padding: 2rem;
            color: #6b7280;
          }
          .empty-comments p, .empty-files p {
            margin: 0.5rem 0;
          }
          .comment-item {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #f3f4f6;
          }
          .comment-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .comment-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
          }
          .author-avatar, .current-user-avatar {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border: 2px solid #000000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: 600;
            color: #000000;
            flex-shrink: 0;
          }
          .comment-meta {
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
          }
          .author-name {
            font-weight: 600;
            color: #000000;
            font-size: 0.875rem;
          }
          .comment-time {
            font-size: 0.75rem;
            color: #6b7280;
          }
          .comment-content {
            margin-left: 2.75rem;
            font-size: 0.875rem;
            color: #374151;
            line-height: 1.5;
          }
          .add-comment {
            border-top: 1px solid #e5e7eb;
            padding: 1.5rem;
            background: #f8fafc;
          }
          .comment-input-container {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            padding: 0;
            margin: 0;
          }
          .comment-input {
            flex: 1;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.875rem;
            line-height: 1.4;
            resize: vertical;
            min-height: 80px;
            max-width: 100%;
            width: 100%;
            box-sizing: border-box;
            transition: all 0.2s ease;
          }
          .comment-input:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .send-comment-btn {
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 0.75rem;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.2s ease;
          }
          .send-comment-btn:hover:not(:disabled) {
            background: #374151;
            transform: translateY(-1px);
          }
          .send-comment-btn:disabled {
            background: #d1d5db;
            cursor: not-allowed;
          }

          /* Files Section */
          .files-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }
          .files-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            background: #f8fafc;
          }
          .files-header h4 {
            font-size: 1rem;
            font-weight: 600;
            color: #000000;
            margin: 0;
          }
          .upload-btn {
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
            font-size: 0.875rem;
          }
          .upload-btn:hover {
            background: #374151;
            transform: translateY(-1px);
          }
          .files-list {
            flex: 1;
            padding: 1.5rem;
            overflow-y: auto;
            max-height: 300px;
          }
          .file-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 0.75rem;
            transition: all 0.2s ease;
          }
          .file-item:hover {
            border-color: #000000;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .file-item:last-child {
            margin-bottom: 0;
          }
          .file-icon {
            width: 40px;
            height: 40px;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            flex-shrink: 0;
          }
          .file-info {
            flex: 1;
            min-width: 0;
          }
          .file-name {
            font-weight: 600;
            color: #000000;
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
            word-break: break-all;
          }
          .file-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.75rem;
            color: #6b7280;
          }
          .file-actions {
            display: flex;
            gap: 0.5rem;
          }
          .download-btn {
            background: #ffffff;
            color: #6b7280;
            border: 1px solid #d1d5db;
            padding: 0.5rem;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.2s ease;
          }
          .download-btn:hover {
            color: #000000;
            border-color: #000000;
            transform: translateY(-1px);
          }
          .task-status-row {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .status-badge {
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            border: 1px solid;
          }
          .status-todo { background: #ffffff; color: #000000; border-color: #000000; }
          .status-in_progress { background: #d1d5db; color: #000000; border-color: #000000; }
          .status-review { background: #9ca3af; color: #ffffff; border-color: #000000; }
          .status-done { background: #000000; color: #ffffff; border-color: #000000; }
          .priority-badge {
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            border: 1px solid;
          }
          .priority-low { background: #ffffff; color: #000000; border-color: #000000; }
          .priority-medium { background: #d1d5db; color: #000000; border-color: #000000; }
          .priority-high { background: #6b7280; color: #ffffff; border-color: #000000; }
          .priority-urgent { background: #000000; color: #ffffff; border-color: #000000; }
          .description {
            margin-bottom: 1.5rem;
          }
          .description h4 {
            font-size: 0.9rem;
            font-weight: 600;
            color: #000000;
            margin: 0 0 0.5rem 0;
          }
          .description p {
            font-size: 0.875rem;
            color: #374151;
            line-height: 1.5;
            margin: 0;
          }
          .task-metadata {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
          }
          .meta-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .meta-item .label {
            font-size: 0.8rem;
            font-weight: 600;
            color: #6b7280;
            min-width: 80px;
          }
          .meta-item .value {
            font-size: 0.8rem;
            color: #000000;
            text-align: right;
            flex: 1;
          }
          .meta-item .value.overdue {
            color: #dc2626;
            font-weight: 600;
          }
          .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
            justify-content: flex-end;
          }
          .tag {
            background: #f3f4f6;
            color: #374151;
            padding: 0.2rem 0.5rem;
            border-radius: 12px;
            font-size: 0.7rem;
            display: flex;
            align-items: center;
            gap: 0.2rem;
            border: 1px solid #d1d5db;
          }

          .status-change-section {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 1rem;
          }
          .status-change-title {
            font-weight: 600;
            color: #000000;
            margin-bottom: 1rem;
            font-size: 0.875rem;
          }
          .status-change-buttons {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
          }
          .status-change-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border: 2px solid #000000;
            border-radius: 6px;
            background: #ffffff;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
            font-size: 0.875rem;
          }
          .status-change-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .status-change-btn.active {
            background: #000000;
            color: #ffffff;
          }
          .status-change-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          /* Modal Splitter Styles */
          .modal-splitter {
            height: 8px;
            background: linear-gradient(to bottom, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
            border-top: 1px solid #d1d5db;
            border-bottom: 1px solid #d1d5db;
            cursor: ns-resize;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            user-select: none;
          }
          .modal-splitter:hover {
            background: linear-gradient(to bottom, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%);
            border-color: #9ca3af;
          }
          .modal-splitter.dragging {
            background: linear-gradient(to bottom, #3b82f6 0%, #1d4ed8 50%, #3b82f6 100%);
            border-color: #1d4ed8;
          }
          .splitter-handle {
            width: 40px;
            height: 4px;
            background: #9ca3af;
            border-radius: 2px;
            transition: all 0.2s ease;
          }
          .modal-splitter:hover .splitter-handle {
            background: #6b7280;
            width: 60px;
          }
          .modal-splitter.dragging .splitter-handle {
            background: #ffffff;
            width: 80px;
            height: 3px;
          }
          
          .resizable-task-details {
            overflow-y: auto;
            flex: none;
          }
          
          .resizable-interaction-section {
            flex: none;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          
          /* Responsive Design */
          
          /* Large desktop styles */
          @media (max-width: 1400px) {
            .calendar-cell {
              min-height: 110px;
            }
          }
          
          /* Desktop styles */
          @media (max-width: 1200px) {
            .calendar-stats {
              grid-template-columns: repeat(3, 1fr);
            }
            .header-controls {
              flex-direction: column;
              gap: 1rem;
            }
            .calendar-cell {
              min-height: 100px;
              padding: 0.75rem;
            }
            .task-item {
              font-size: 0.65rem;
              padding: 0.4rem;
            }
          }
          
          /* Tablet styles */
          @media (max-width: 1024px) {
            .main-content {
              margin-left: 0;
            }
            .header {
              padding: 1rem 1.5rem;
            }
            .calendar-content {
              padding: 1.5rem;
            }
            .calendar-stats {
              grid-template-columns: repeat(2, 1fr);
            }
            .calendar-cell {
              min-height: 90px;
              padding: 0.625rem;
            }
            .calendar-header-cell {
              padding: 0.875rem;
            }
            .task-item {
              font-size: 0.7rem;
              padding: 0.5rem;
            }
            .task-name {
              font-size: 0.75rem;
            }
            .task-meta {
              font-size: 0.65rem;
            }
          }
          
          /* Mobile styles */
          @media (max-width: 768px) {
            * {
              box-sizing: border-box !important;
            }
            
            body, html {
              width: 100% !important;
              max-width: 100vw !important;
              overflow-x: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .calendar-container {
              min-height: 100vh;
              display: block !important;
              background: #F5F5ED;
              width: 100vw !important;
              max-width: 100vw !important;
              overflow-x: hidden;
              margin: 0;
              padding: 0;
            }
            
            .main-content {
              margin-left: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
              overflow-x: hidden;
              padding-top: 70px;
              margin: 0;
              padding-left: 0;
              padding-right: 0;
            }
            
            .header {
              padding: 0.875rem;
              position: relative;
              top: 0;
              background: #ffffff;
              border-bottom: 1px solid #e5e7eb;
              z-index: 30;
              width: 100vw !important;
              max-width: 100vw !important;
              box-sizing: border-box;
              margin: 0;
              overflow-x: hidden;
            }
            .header-title {
              font-size: 1.375rem;
            }
            .header-content {
              flex-direction: column;
              gap: 0.875rem;
              margin-bottom: 0.875rem;
            }
            .header-controls {
              width: 100%;
              max-width: 100%;
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
              gap: 1rem;
            }
            .calendar-nav {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 1rem;
              flex: 1;
            }
            .today-nav {
              flex-shrink: 0;
            }
            .month-year {
              font-size: 1rem;
              font-weight: 700;
              color: #000000;
              text-align: center;
              flex: 1;
            }
            .nav-btn {
              padding: 0.75rem;
              min-width: 44px;
              min-height: 44px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .filter-btn {
              display: none;
            }
            .calendar-stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 0.375rem;
              margin-top: 0.875rem;
              width: 100%;
              max-width: 100%;
              box-sizing: border-box;
            }
            .stat-item {
              padding: 0.625rem 0.25rem;
              border-radius: 6px;
              background: rgba(255, 255, 255, 0.95);
              border: 1px solid #e5e7eb;
              text-align: center;
              min-height: 50px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              box-sizing: border-box;
              overflow: hidden;
            }
            .stat-value {
              font-size: 1.125rem;
              font-weight: 800;
              margin-bottom: 0.125rem;
              line-height: 1;
            }
            .stat-label {
              font-size: 0.6rem;
              font-weight: 600;
              color: #6b7280;
              line-height: 1.2;
              word-break: break-word;
            }
            .calendar-content {
              padding: 0.5rem !important;
              width: 100vw !important;
              max-width: 100vw !important;
              box-sizing: border-box;
              display: block !important;
              visibility: visible !important;
              margin: 0 !important;
              overflow-x: hidden;
            }
            
            .calendar-grid {
              border-radius: 8px;
              overflow: visible;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
              border: 1px solid #e5e7eb;
              width: calc(100vw - 1rem) !important;
              max-width: calc(100vw - 1rem) !important;
              box-sizing: border-box;
              display: block !important;
              visibility: visible !important;
              margin: 0 !important;
            }
            
            /* Mobile Calendar Header */
            .calendar-header {
              background: #f9fafb;
              padding: 0;
              display: grid !important;
              grid-template-columns: repeat(7, 1fr) !important;
              width: 100% !important;
            }
            .calendar-header-cell {
              color: #374151;
              font-weight: 700;
              font-size: 0.75rem;
              text-align: center;
              padding: 0.75rem 0.125rem;
              border-right: 1px solid #e5e7eb;
              box-sizing: border-box;
              overflow: hidden;
            }
            .calendar-header-cell:last-child {
              border-right: none;
            }
            
            /* Mobile Calendar Body */
            .calendar-body {
              background: #ffffff;
              display: grid !important;
              grid-template-columns: repeat(7, 1fr) !important;
              width: 100%;
              visibility: visible !important;
            }
            .calendar-cell {
              min-height: 85px;
              padding: 0.375rem;
              border-right: 1px solid #f1f5f9;
              border-bottom: 1px solid #f1f5f9;
              background: #ffffff;
              transition: all 0.2s ease;
              position: relative;
              display: flex;
              flex-direction: column;
              box-sizing: border-box;
              overflow: hidden;
            }
            .calendar-cell:hover {
              background: #f8fafc;
              border-color: #e2e8f0;
            }
            .calendar-cell:nth-child(7n) {
              border-right: none;
            }
            .calendar-cell.other-month {
              background: #f9fafb;
              opacity: 0.6;
            }
            .calendar-cell.other-month .day-number {
              color: #9ca3af;
            }
            .calendar-cell.today {
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              border: 2px solid #000000;
              box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
            }
            .calendar-cell.today .day-number {
              color: #000000;
              font-weight: 800;
            }
            .day-number {
              font-size: 0.8rem;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 0.25rem;
              display: block;
              text-align: left;
            }
            .events-container {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 0.125rem;
              overflow: hidden;
            }
            .task-item {
              font-size: 0.6rem;
              padding: 0.25rem;
              border-radius: 4px;
              margin-bottom: 0;
              min-height: auto;
              line-height: 1.2;
              cursor: pointer;
              transition: all 0.2s ease;
              border: 1px solid transparent;
              position: relative;
              overflow: hidden;
            }
            .task-item:hover {
              transform: translateY(-1px);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
              border-color: rgba(0, 0, 0, 0.1);
            }
            .task-header {
              margin-bottom: 0.125rem;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .task-name {
              font-size: 0.6rem;
              line-height: 1.2;
              font-weight: 600;
              color: #1f2937;
              flex: 1;
              margin-right: 0.125rem;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              word-break: break-word;
            }
            .task-icons {
              display: flex;
              align-items: center;
              gap: 0.125rem;
              flex-shrink: 0;
            }
            .task-meta {
              font-size: 0.5rem;
              color: #6b7280;
              line-height: 1.1;
              display: flex;
              flex-direction: column;
              gap: 0.125rem;
            }
            .project-name {
              font-weight: 500;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              width: 100%;
            }
            .assignee {
              display: flex;
              align-items: center;
              gap: 0.125rem;
              font-size: 0.5rem;
              color: #6b7280;
            }
            .more-tasks {
              padding: 0.1875rem;
              font-size: 0.55rem;
              border-radius: 3px;
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              color: #6b7280;
              text-align: center;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              border: 1px solid #d1d5db;
              margin-top: 0.125rem;
            }
            .more-tasks:hover {
              background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
              color: #374151;
              transform: translateY(-1px);
            }
          }
          
          /* Small mobile styles */
          @media (max-width: 480px) {
            .header {
              padding: 0.75rem;
            }
            .header-title {
              font-size: 1.25rem;
            }
            .header-controls {
              flex-direction: column !important;
              gap: 0.75rem !important;
            }
            .calendar-nav {
              width: 100% !important;
              max-width: none !important;
              justify-content: space-between !important;
              flex: none !important;
            }
            .today-nav {
              width: 100% !important;
            }
            .today-btn {
              width: 100% !important;
              padding: 0.75rem !important;
              font-size: 0.875rem !important;
            }
            .calendar-stats {
              grid-template-columns: repeat(4, 1fr);
              gap: 0.25rem;
            }
            .stat-item {
              padding: 0.5rem 0.125rem;
              min-height: 45px;
            }
            .stat-value {
              font-size: 1rem;
            }
            .stat-label {
              font-size: 0.55rem;
            }
            .month-year {
              font-size: 0.85rem;
              flex: 1;
              text-align: center;
            }
            .nav-btn {
              min-width: 36px;
              min-height: 36px;
              padding: 0.5rem;
            }
            .calendar-content {
              padding: 0.625rem;
            }
            .calendar-header-cell {
              font-size: 0.65rem;
              padding: 0.625rem 0.0625rem;
            }
            .calendar-cell {
              min-height: 70px;
              padding: 0.25rem;
            }
            .day-number {
              font-size: 0.75rem;
              margin-bottom: 0.1875rem;
            }
            .task-item {
              font-size: 0.55rem;
              padding: 0.1875rem;
              border-radius: 3px;
            }
            .task-name {
              font-size: 0.55rem;
              line-height: 1.1;
            }
            .task-meta {
              font-size: 0.45rem;
            }
            .project-name {
              width: 100%;
            }
            .assignee {
              font-size: 0.45rem;
            }
            .more-tasks {
              font-size: 0.5rem;
              padding: 0.125rem;
            }
          }
          
          /* Landscape mobile optimization */
          @media (max-width: 896px) and (orientation: landscape) {
            .calendar-stats {
              grid-template-columns: repeat(4, 1fr);
            }
            .calendar-cell {
              min-height: 60px;
            }
          }
            
            /* Mobile Modal Styles */
            .modal-overlay {
              padding: 0.75rem;
              align-items: center;
              justify-content: center;
              background: rgba(0, 0, 0, 0.6);
            }
            .enhanced-task-modal {
              margin: 0;
              width: 100%;
              max-width: calc(100vw - 1.5rem);
              max-height: calc(100vh - 1.5rem);
              height: auto;
              min-height: 80vh;
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
              display: flex;
              flex-direction: column;
              overflow: hidden;
            }
            .modal-header {
              padding: 1rem;
              border-bottom: 1px solid #e5e7eb;
              background: #ffffff;
              position: relative;
              flex-shrink: 0;
            }
            .modal-header h3 {
              font-size: 1rem;
              line-height: 1.3;
              padding-right: 2.5rem;
              margin: 0;
              font-weight: 600;
            }
            .close-btn {
              position: absolute;
              top: 0.75rem;
              right: 0.75rem;
              font-size: 1.125rem;
              padding: 0.375rem;
              background: #f8fafc;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid #e5e7eb;
            }
            .task-details-section {
              padding: 1rem;
              flex: 1;
              overflow-y: auto;
              background: #ffffff;
            }
            .task-status-row {
              display: flex;
              gap: 0.5rem;
              align-items: flex-start;
              margin-bottom: 1rem;
              flex-wrap: wrap;
            }
            .status-badge, .priority-badge {
              font-size: 0.7rem;
              padding: 0.375rem 0.75rem;
              border-radius: 20px;
              font-weight: 600;
            }
            .description {
              margin-bottom: 1rem;
            }
            .description h4 {
              font-size: 0.85rem;
              margin-bottom: 0.5rem;
            }
            .description p {
              font-size: 0.8rem;
              line-height: 1.4;
            }
            .task-metadata {
              gap: 0.75rem;
              margin-bottom: 1rem;
            }
            .meta-item {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 0.5rem 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .meta-item:last-child {
              border-bottom: none;
            }
            .meta-item .label {
              font-size: 0.7rem;
              color: #6b7280;
              font-weight: 500;
              min-width: 60px;
            }
            .meta-item .value {
              font-size: 0.8rem;
              text-align: right;
              flex: 1;
              font-weight: 500;
            }
            .meta-item .value.overdue {
              color: #dc2626;
              font-weight: 600;
            }
            .tags {
              justify-content: flex-end;
              flex-wrap: wrap;
              gap: 0.25rem;
            }
            .tag {
              font-size: 0.65rem;
              padding: 0.2rem 0.5rem;
              background: #f3f4f6;
              border-radius: 12px;
              border: 1px solid #e5e7eb;
            }
            .status-change-section {
              background: #f8fafc;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 1rem;
              margin-top: 1rem;
            }
            .status-change-title {
              font-size: 0.85rem;
              font-weight: 600;
              margin-bottom: 0.75rem;
              color: #000000;
            }
            .status-change-buttons {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0.5rem;
            }
            .status-change-btn {
              padding: 0.75rem 0.5rem;
              font-size: 0.75rem;
              justify-content: center;
              min-height: 44px;
              border-radius: 6px;
              font-weight: 500;
            }
            
            /* Mobile Modal Splitter */
            .modal-splitter {
              height: 8px;
              touch-action: none;
              background: #f3f4f6;
              cursor: ns-resize;
            }
            .splitter-handle {
              width: 40px;
              height: 3px;
              background: #9ca3af;
            }
            
            /* Mobile Tab Navigation */
            .tab-navigation {
              overflow-x: auto;
              scrollbar-width: none;
              -ms-overflow-style: none;
              background: #f8fafc;
              border-bottom: 1px solid #e5e7eb;
              flex-shrink: 0;
            }
            .tab-navigation::-webkit-scrollbar {
              display: none;
            }
            .tab-btn {
              padding: 0.875rem 1rem;
              font-size: 0.8rem;
              min-width: 100px;
              white-space: nowrap;
              min-height: 48px;
              font-weight: 500;
            }
            
            /* Mobile Comments & Files */
            .comments-list, .files-list {
              max-height: 200px;
              padding: 0.875rem;
              overflow-y: auto;
            }
            .comment-item {
              margin-bottom: 1rem;
              padding-bottom: 0.75rem;
            }
            .comment-header {
              gap: 0.5rem;
              margin-bottom: 0.5rem;
            }
            .author-avatar, .current-user-avatar {
              width: 32px;
              height: 32px;
              font-size: 0.8rem;
            }
            .comment-content {
              margin-left: 2.5rem;
              font-size: 0.85rem;
              line-height: 1.4;
            }
            .add-comment {
              padding: 1rem;
              background: #f8fafc;
              border-top: 1px solid #e5e7eb;
            }
            .comment-input-container {
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
            }
            .comment-input {
              min-height: 80px;
              font-size: 0.9rem;
              padding: 0.875rem;
              border-radius: 8px;
              border: 2px solid #e5e7eb;
              resize: vertical;
            }
            .comment-input:focus {
              border-color: #000000;
              outline: none;
            }
            .send-comment-btn {
              align-self: stretch;
              padding: 0.875rem;
              justify-content: center;
              font-size: 0.85rem;
              min-height: 44px;
              background: #000000;
              color: #ffffff;
              border: none;
              border-radius: 8px;
              font-weight: 600;
            }
            .files-header {
              padding: 1rem;
              background: #f8fafc;
              border-bottom: 1px solid #e5e7eb;
            }
            .files-header h4 {
              font-size: 0.9rem;
              font-weight: 600;
              margin: 0;
            }
            .upload-btn {
              padding: 0.625rem 1rem;
              font-size: 0.8rem;
              min-height: 40px;
              background: #000000;
              color: #ffffff;
              border: none;
              border-radius: 6px;
              font-weight: 500;
            }
            .file-item {
              padding: 0.875rem;
              border-bottom: 1px solid #f3f4f6;
              display: flex;
              align-items: center;
              gap: 0.75rem;
            }
            .file-item:last-child {
              border-bottom: none;
            }
            .file-icon {
              width: 40px;
              height: 40px;
              background: #f3f4f6;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .file-info {
              flex: 1;
              min-width: 0;
            }
            .file-name {
              font-size: 0.85rem;
              font-weight: 500;
              margin-bottom: 0.25rem;
              word-break: break-word;
            }
            .file-meta {
              font-size: 0.7rem;
              color: #6b7280;
              display: flex;
              gap: 0.5rem;
            }
            .file-actions {
              flex-shrink: 0;
            }
            .download-btn {
              padding: 0.5rem;
              font-size: 0.8rem;
              min-height: 36px;
              min-width: 36px;
              background: #f8fafc;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
          
          /* Small mobile styles */
          @media (max-width: 480px) {
            .calendar-container,
            .main-content,
            .header,
            .header-content,
            .calendar-content,
            .calendar-grid,
            .calendar-header,
            .calendar-body {
              width: 100vw !important;
              max-width: 100vw !important;
              margin: 0 !important;
              padding-left: 0.5rem !important;
              padding-right: 0.5rem !important;
              box-sizing: border-box !important;
            }
            
            .header {
              padding: 0.875rem 0.5rem;
            }
            .header-title {
              font-size: 1.375rem;
            }
            .calendar-stats {
              grid-template-columns: 1fr;
              gap: 0.5rem;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .stat-item {
              padding: 0.75rem;
            }
            .calendar-nav {
              gap: 0.5rem;
              width: 100% !important;
            }
            .month-year {
              font-size: 0.9rem;
              flex: 1;
              text-align: center;
            }
            .calendar-content {
              padding: 0.5rem !important;
              width: 100vw !important;
              margin: 0 !important;
            }
            .calendar-grid {
              width: calc(100vw - 1rem) !important;
              margin: 0 !important;
            }
            .calendar-cell {
              padding: 0.875rem;
              flex-direction: column;
              align-items: flex-start;
            }
            .day-number {
              align-self: flex-start;
              margin-bottom: 0.75rem;
              margin-right: 0;
            }
            .events-container {
              width: 100%;
            }
            .important-tasks-sidebar {
              margin: 0.75rem;
            }
            .important-tasks-list {
              padding: 0.875rem;
            }
            .important-task-item {
              padding: 0.875rem;
              flex-direction: column;
              gap: 0.75rem;
            }
            .star-btn-large {
              align-self: flex-end;
            }
            .enhanced-task-modal {
              border-radius: 8px 8px 0 0;
              max-height: 95vh;
              height: 95vh;
            }
            .modal-header {
              padding: 0.875rem;
            }
            .modal-header h3 {
              font-size: 0.9rem;
              padding-right: 2rem;
            }
            .close-btn {
              width: 28px;
              height: 28px;
              top: 0.625rem;
              right: 0.625rem;
              font-size: 1rem;
            }
            .task-details-section {
              padding: 0.875rem;
            }
            .task-status-row {
              gap: 0.375rem;
            }
            .status-badge, .priority-badge {
              font-size: 0.65rem;
              padding: 0.3rem 0.6rem;
            }
            .meta-item .label {
              font-size: 0.65rem;
              min-width: 50px;
            }
            .meta-item .value {
              font-size: 0.75rem;
            }
            .status-change-section {
              padding: 0.875rem;
            }
            .status-change-title {
              font-size: 0.8rem;
            }
            .status-change-buttons {
              grid-template-columns: 1fr;
              gap: 0.5rem;
            }
            .status-change-btn {
              padding: 0.75rem;
              font-size: 0.7rem;
            }
            .tab-btn {
              min-width: 80px;
              padding: 0.75rem 0.75rem;
              font-size: 0.75rem;
              min-height: 44px;
            }
            .comment-input {
              min-height: 70px;
              font-size: 0.85rem;
              padding: 0.75rem;
            }
            .send-comment-btn {
              padding: 0.75rem;
              font-size: 0.8rem;
              min-height: 40px;
            }
          }
          
          /* Landscape mobile optimization */
          @media (max-width: 896px) and (orientation: landscape) {
            .enhanced-task-modal {
              height: 90vh;
              max-height: 90vh;
              align-items: center;
              border-radius: 12px;
            }
            .modal-overlay {
              align-items: center;
              padding: 1rem;
            }
            .calendar-stats {
              grid-template-columns: repeat(4, 1fr);
            }
            .important-tasks-sidebar {
              order: 0;
            }
          }
        `}}),(0,a.jsxs)("div",{className:"calendar-container",children:[!M&&a.jsx(g.Z,{projects:u,onCreateProject:()=>{}}),(0,a.jsxs)("div",{className:"main-content",children:[(0,a.jsxs)("header",{className:"header",children:[(0,a.jsxs)("div",{className:"header-content",children:[(0,a.jsxs)("h1",{className:"header-title",children:[a.jsx(m.Z,{style:{width:"32px",height:"32px"}}),"Calendar"]}),(0,a.jsxs)("div",{className:"header-controls",children:[(0,a.jsxs)("div",{className:"calendar-nav",children:[a.jsx("button",{onClick:()=>{_(new Date(N.getFullYear(),N.getMonth()-1))},className:"nav-btn",children:a.jsx(c.Z,{style:{width:"20px",height:"20px"}})}),(0,a.jsxs)("div",{className:"month-year",children:[["January","February","March","April","May","June","July","August","September","October","November","December"][N.getMonth()]," ",N.getFullYear()]}),a.jsx("button",{onClick:()=>{_(new Date(N.getFullYear(),N.getMonth()+1))},className:"nav-btn",children:a.jsx(p.Z,{style:{width:"20px",height:"20px"}})})]}),a.jsx("div",{className:"today-nav",children:a.jsx("button",{onClick:()=>_(new Date),className:"today-btn",style:{background:"#3b82f6",color:"#ffffff",border:"none",padding:"0.75rem 1.5rem",borderRadius:"8px",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",transition:"all 0.2s ease"},children:"Today"})})]})]}),(0,a.jsxs)("div",{className:"calendar-stats",children:[(0,a.jsxs)("div",{className:"stat-item",children:[a.jsx("span",{className:"stat-label",children:"Total Tasks"}),a.jsx("span",{className:"stat-value",children:y.length})]}),(0,a.jsxs)("div",{className:"stat-item",children:[a.jsx("span",{className:"stat-label",children:"In Progress"}),a.jsx("span",{className:"stat-value",children:y.filter(e=>"in_progress"===e.status).length})]}),(0,a.jsxs)("div",{className:"stat-item",children:[a.jsx("span",{className:"stat-label",children:"Due Today"}),a.jsx("span",{className:"stat-value",children:Z(Q).length})]}),(0,a.jsxs)("div",{className:"stat-item",children:[a.jsx("span",{className:"stat-label",children:"Overdue"}),a.jsx("span",{className:"stat-value overdue",children:y.filter(e=>H(e.due_date)).length})]})]})]}),(0,a.jsxs)("main",{className:"calendar-content",children:[(0,a.jsxs)("div",{className:"calendar-grid",children:[a.jsx("div",{className:"calendar-header",children:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(e=>a.jsx("div",{className:"calendar-header-cell",children:e},e))}),(0,a.jsxs)("div",{className:"calendar-body",children:[Array.from({length:et},(e,t)=>{let r=new Date(N.getFullYear(),N.getMonth()-1),i=L(r);return a.jsx("div",{className:"calendar-cell other-month",children:a.jsx("div",{className:"day-number",children:i-et+t+1})},`prev-${t}`)}),Array.from({length:ee},(e,t)=>{let r=t+1,i=new Date(N.getFullYear(),N.getMonth(),r),n=N.getMonth()===Q.getMonth()&&N.getFullYear()===Q.getFullYear()&&r===Q.getDate(),o=Z(i);return(0,a.jsxs)("div",{className:`calendar-cell ${n?"today":""}`,children:[a.jsx("div",{className:"day-number",children:r}),(0,a.jsxs)("div",{className:"events-container",children:[(o||[]).slice(0,3).map(e=>(0,a.jsxs)("div",{className:`task-item ${e.is_important?"important":""} ${H(e.due_date)?"overdue":""}`,style:{borderLeft:`3px solid ${U(e.status)}`},onClick:()=>G(e),children:[(0,a.jsxs)("div",{className:"task-header",children:[a.jsx("span",{className:"task-name",children:e.name}),a.jsx("div",{className:"task-icons",children:R(e.priority)})]}),(0,a.jsxs)("div",{className:"task-meta",children:[a.jsx("span",{className:"project-name",style:{color:"#000000"},children:e.project_name}),e.assignee&&(0,a.jsxs)("span",{className:"assignee",children:[a.jsx(f.Z,{style:{width:"10px",height:"10px"}}),e.assignee.name?e.assignee.name.split(" ")[0]:"Unknown"]})]})]},e.id)),(o||[]).length>3&&(0,a.jsxs)("div",{className:"more-tasks",onClick:e=>{e.stopPropagation(),K(i,o||[])},style:{cursor:"pointer"},children:["+",(o||[]).length-3," more"]})]})]},r)}),Array.from({length:42-(et+ee)},(e,t)=>a.jsx("div",{className:"calendar-cell other-month",children:a.jsx("div",{className:"day-number",children:t+1})},`next-${t}`))]})]}),P&&E&&a.jsx(h.Z,{task:E,users:[],onClose:V,onSave:J,onStatusChange:W,onDelete:X}),B&&$&&a.jsx("div",{className:"modal-overlay",onClick:()=>{T(!1),Y(null),q([])},children:(0,a.jsxs)("div",{className:"enhanced-task-modal",onClick:e=>e.stopPropagation(),children:[(0,a.jsxs)("div",{className:"modal-header",children:[(0,a.jsxs)("h3",{children:["Tasks for ",$.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})]}),a.jsx("button",{type:"button",onClick:()=>{T(!1),Y(null),q([])},className:"close-btn",children:"\xd7"})]}),a.jsx("div",{className:"task-details-section",style:{maxHeight:"100%",overflow:"auto"},children:0===A.length?a.jsx("div",{className:"empty-comments",children:a.jsx("p",{children:"No tasks scheduled for this day"})}):a.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"1rem"},children:A.map(e=>(0,a.jsxs)("div",{className:"task-item",style:{padding:"1rem",border:"2px solid #e5e7eb",borderRadius:"8px",background:"#ffffff",cursor:"pointer",transition:"all 0.2s ease",borderLeft:`4px solid ${U(e.status)}`},onClick:()=>{T(!1),Y(null),q([]),G(e)},onMouseOver:e=>{e.currentTarget.style.background="#f9fafb",e.currentTarget.style.borderColor="#000000"},onMouseOut:e=>{e.currentTarget.style.background="#ffffff",e.currentTarget.style.borderColor="#e5e7eb"},children:[(0,a.jsxs)("div",{className:"task-status-row",children:[a.jsx("span",{className:`status-badge status-${e.status}`,children:e.status.replace("_"," ")}),(0,a.jsxs)("span",{className:`priority-badge priority-${e.priority}`,children:[R(e.priority),e.priority]})]}),(0,a.jsxs)("div",{style:{marginBottom:"0.75rem"},children:[a.jsx("h4",{style:{margin:0,fontSize:"1rem",fontWeight:"600",color:"#000000"},children:e.name}),a.jsx("p",{style:{margin:"0.25rem 0 0 0",fontSize:"0.875rem",color:"#666666"},children:e.project_name})]}),e.description&&a.jsx("p",{style:{margin:"0.5rem 0",fontSize:"0.875rem",color:"#374151",lineHeight:"1.4"},children:e.description}),(0,a.jsxs)("div",{className:"task-metadata",children:[e.assignee&&(0,a.jsxs)("div",{className:"meta-item",children:[a.jsx("span",{className:"label",children:"Assigned to:"}),a.jsx("span",{className:"value",children:e.assignee.name})]}),e.estimated_hours&&(0,a.jsxs)("div",{className:"meta-item",children:[a.jsx("span",{className:"label",children:"Estimated:"}),(0,a.jsxs)("span",{className:"value",children:[e.estimated_hours,"h"]})]}),e.tags_list&&e.tags_list.length>0&&(0,a.jsxs)("div",{className:"meta-item",children:[a.jsx("span",{className:"label",children:"Tags:"}),a.jsx("div",{className:"tags",children:e.tags_list.map((e,t)=>a.jsx("span",{className:"tag",children:e},t))})]})]})]},e.id))})})]})})]})]})]})]}):null}},1046:(e,t,r)=>{"use strict";r.r(t),r.d(t,{$$typeof:()=>o,__esModule:()=>n,default:()=>d});var a=r(5153);let i=(0,a.createProxy)(String.raw`/Users/swumpyaesone/Documents/project_management/frontend/src/app/calendar/page.tsx`),{__esModule:n,$$typeof:o}=i,s=i.default,d=s}};var t=require("../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[3271,1816,1323,7490,5446,8297,6097,1998,4937,5],()=>r(4948));module.exports=a})();