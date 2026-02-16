(()=>{var e={};e.id=5329,e.ids=[5329],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},13685:e=>{"use strict";e.exports=require("http")},95687:e=>{"use strict";e.exports=require("https")},71017:e=>{"use strict";e.exports=require("path")},85477:e=>{"use strict";e.exports=require("punycode")},12781:e=>{"use strict";e.exports=require("stream")},57310:e=>{"use strict";e.exports=require("url")},59796:e=>{"use strict";e.exports=require("zlib")},18010:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>o.a,__next_app__:()=>p,originalPathname:()=>c,pages:()=>m,routeModule:()=>g,tree:()=>d});var n=r(67096),i=r(16132),a=r(37284),o=r.n(a),s=r(32564),l={};for(let e in s)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>s[e]);r.d(t,l);let d=["",{children:["calendar",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,1046)),"/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/calendar/page.tsx"]}]},{metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(r.bind(r,28835)),"/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,9291,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],m=["/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/calendar/page.tsx"],c="/calendar/page",p={require:r,loadChunk:()=>Promise.resolve()},g=new n.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/calendar/page",pathname:"/calendar",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},99158:(e,t,r)=>{Promise.resolve().then(r.bind(r,36067))},36067:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>z});var n=r(53854),i=r(34218),a=r(51018),o=r(56837);r(44937);var s=r(2132),l=r(42150),d=r(54791),m=r(84063),c=r(10789),p=r(67689),g=r(69072),x=r(96835),h=r(82244),u=r(44358),b=r(61685),f=r(32399),y=r(2769),F=r(26965),D=r(71888);let w=i.forwardRef(function({title:e,titleId:t,...r},n){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:n,"aria-labelledby":t},r),e?i.createElement("title",{id:t},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"}))});var v=r(62075),k=r(66823),j=r(71111);function z(){let e=(0,a.useRouter)(),{user:t,isAuthenticated:r,isLoading:z}=(0,o.useAuth)(),[_,A]=(0,i.useState)([]),[C,E]=(0,i.useState)([]),[S,B]=(0,i.useState)(!0),[M,T]=(0,i.useState)(null),[N,R]=(0,i.useState)(new Date),[W,I]=(0,i.useState)(!1),[P,L]=(0,i.useState)(null),[Z,Y]=(0,i.useState)(!1),[$,q]=(0,i.useState)(!1),[U,O]=(0,i.useState)([]),[H,G]=(0,i.useState)(null),[J,V]=(0,i.useState)(!1),[K,X]=(0,i.useState)({title:"",description:"",start_date:"",start_time:"09:00",duration:60,project_id:null,attendee_ids:[],agenda_items:[],meeting_link:"",reminder_time:"15",recurring:!1}),[Q,ee]=(0,i.useState)(""),[et,er]=(0,i.useState)([]),[en,ei]=(0,i.useState)("month");(0,i.useEffect)(()=>{let e=()=>{I(window.innerWidth<768)};return e(),window.addEventListener("resize",e),()=>window.removeEventListener("resize",e)},[]),(0,i.useEffect)(()=>{if(!z){if(!r){e.push("/login");return}ea()}},[r,z,e]);let ea=async()=>{try{T(null);let[e,r]=await Promise.all([s.supabase.from("projects_meeting").select("id, title, description, date, time, duration, project_id, created_by_id, attendee_ids, meeting_link, location, notes, created_at, updated_at").order("date",{ascending:!0}),s.supabase.from("projects_project").select("id, name, color")]);if(e.error){console.error("Error fetching meetings:",e.error),E([]),B(!1);return}let n=new Map;(r.data||[]).forEach(e=>{n.set(e.id,{name:e.name,color:e.color})});let i=t?.id,a=(e.data||[]).filter(e=>!!(e.created_by_id===i||e.attendee_ids&&Array.isArray(e.attendee_ids)&&e.attendee_ids.includes(i))).map(e=>{let t=e.date&&e.time?`${e.date}T${e.time}`:e.date,r=t;if(e.duration&&t){let n=new Date(t);n.setMinutes(n.getMinutes()+e.duration),r=n.toISOString()}let i=n.get(e.project_id);return{id:e.id,name:e.title,description:e.description||"",status:"todo",priority:"medium",due_date:r,start_date:t,estimated_hours:e.duration?e.duration/60:null,actual_hours:null,assignees:[],assignee:null,created_by:{id:e.created_by_id,name:"",email:"",role:""},tags_list:[],created_at:e.created_at,updated_at:e.updated_at,project_id:e.project_id,project_name:i?.name||"Personal",project_color:i?.color||"#3B82F6",is_important:!1,_meetingData:e}});A(r.data||[]),E(a)}catch(e){console.error("Calendar: Failed to fetch meetings:",e),T(e instanceof Error?e.message:"Failed to load calendar data")}finally{B(!1)}},eo=["January","February","March","April","May","June","July","August","September","October","November","December"],es=e=>new Date(e.getFullYear(),e.getMonth()+1,0).getDate(),el=e=>new Date(e.getFullYear(),e.getMonth(),1).getDay(),ed=e=>{let t=e.toISOString().split("T")[0],r=C.filter(e=>{let r=e.due_date?e.due_date.split("T")[0]:null;return r===t});return r.sort((e,t)=>e.is_important&&!t.is_important?-1:!e.is_important&&t.is_important?1:e.name.localeCompare(t.name))},em=e=>{G(e),X({title:"",description:"",start_date:e.toISOString().split("T")[0],start_time:"09:00",duration:60,project_id:null,attendee_ids:[],agenda_items:[],meeting_link:"",reminder_time:"15",recurring:!1}),ee(""),er([]),V(!0)},ec=async e=>{if(X({...K,project_id:e,attendee_ids:[]}),e){let t=_.find(t=>t.id===e);t&&t.members?er(t.members):er([])}else er([])},ep=e=>{e._meetingData&&(L(e._meetingData),Y(!0))},[eg,ex]=(0,i.useState)(!1),eh=async()=>{if(K.title.trim()&&K.start_date&&!eg){ex(!0);try{let{error:e}=await s.supabase.from("projects_meeting").insert({title:K.title.trim(),description:K.description.trim(),date:K.start_date,time:K.start_time,duration:K.duration,project_id:K.project_id,created_by_id:t?.id,attendee_ids:K.attendee_ids.length>0?K.attendee_ids:[t?.id],agenda_items:K.agenda_items,meeting_link:K.meeting_link.trim()||null,reminder_time:K.reminder_time?parseInt(K.reminder_time):null,created_at:new Date().toISOString(),updated_at:new Date().toISOString()});if(e){console.error("Error creating meeting:",e),alert("Failed to create meeting: "+e.message),ex(!1);return}await ea(),X({title:"",description:"",start_date:"",start_time:"09:00",duration:60,project_id:null,attendee_ids:[],agenda_items:[],meeting_link:"",reminder_time:"15",recurring:!1}),ee(""),V(!1)}catch(e){console.error("Error creating meeting:",e),alert("Failed to create meeting")}finally{ex(!1)}}},eu=e=>{switch(e){case"urgent":case"high":return n.jsx(l.Z,{style:{width:"12px",height:"12px",color:"#FFFFFF"}});case"medium":return n.jsx(d.Z,{style:{width:"12px",height:"12px",color:"#FFFFFF"}});default:return null}},eb=e=>{switch(e){case"done":return"#10B981";case"in_progress":return"#3B82F6";case"review":return"#A1A1AA";default:return"#3D3D3D"}},ef=e=>!!e&&new Date(e)<new Date,ey=e=>{Z||ep(e)},eF=async e=>{try{await s.supabase.from("projects_meeting").update(e).eq("id",P.id),await ea(),Y(!1),L(null)}catch(e){console.error("Failed to update meeting:",e)}},eD=async e=>{try{await s.supabase.from("projects_meeting").delete().eq("id",e),await ea(),Y(!1),L(null)}catch(e){console.error("Failed to delete meeting:",e)}},ew=(e,t)=>{G(e),O(t),q(!0)};(0,i.useEffect)(()=>{let e=e=>{"Escape"===e.key&&Z&&(Y(!1),L(null))};if(Z)return document.addEventListener("keydown",e),document.body.style.overflow="hidden",()=>{document.removeEventListener("keydown",e),document.body.style.overflow="unset"}},[Z]);let ev=new Date,ek=(0,i.useMemo)(()=>es(N),[N]),ej=(0,i.useMemo)(()=>el(N),[N]);return z?n.jsx("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0D0D0D"},children:n.jsx("div",{style:{width:"32px",height:"32px",border:"3px solid #3D3D3D",borderTop:"3px solid #3B82F6",borderRadius:"50%",animation:"spin 1s linear infinite"}})}):r?S?n.jsx("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0D0D0D"},children:n.jsx("div",{style:{width:"32px",height:"32px",border:"3px solid #3D3D3D",borderTop:"3px solid #3B82F6",borderRadius:"50%",animation:"spin 1s linear infinite"}})}):M?(0,n.jsxs)("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0D0D0D",flexDirection:"column",gap:"1rem",padding:"2rem"},children:[n.jsx(l.Z,{style:{width:"48px",height:"48px",color:"#F87239"}}),n.jsx("h2",{style:{color:"#FFFFFF",fontSize:"1.5rem",fontWeight:"600",textAlign:"center"},children:"Calendar Error"}),n.jsx("p",{style:{color:"#71717A",textAlign:"center",maxWidth:"400px"},children:M}),n.jsx("button",{onClick:()=>{T(null),ea()},style:{background:"#3B82F6",color:"#ffffff",border:"none",padding:"0.75rem 1.5rem",borderRadius:"8px",fontWeight:"600",cursor:"pointer",transition:"all 0.2s ease"},children:"Try Again"})]}):(0,n.jsxs)("div",{className:"calendar-container",children:[n.jsx("style",{dangerouslySetInnerHTML:{__html:`
        .calendar-container {
          min-height: 100vh;
          display: flex;
          background: #0D0D0D;
          width: 100%;
          ${W?"flex-direction: column;":""}
        }
        

        .main-content {
          flex: 1;
          margin-left: ${W?"0":"280px"};
          background: transparent;
          position: relative;
          z-index: 1;
          padding-top: ${W?"70px":"0"};
          width: ${W?"100vw":"auto"};
          min-height: 100vh;
          ${W?"margin-left: 0 !important; max-width: 100vw; overflow-x: hidden;":""}
        }
        
        .header {
          background: #141414;
          border-bottom: 1px solid #2D2D2D;
          padding: 2.5rem 2rem 1.5rem 2rem;
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          max-width: ${W?"none":"1200px"};
          margin-left: auto;
          margin-right: auto;
          width: ${W?"100%":"auto"};
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
          background: rgba(26, 26, 26, 0.9);
          backdrop-filter: blur(15px);
          color: #E4E4E7;
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
          max-width: ${W?"none":"1000px"};
          margin: 0 auto;
          width: ${W?"100%":"auto"};
        }
        
        .calendar-stats .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          background: #1A1A1A;
          padding: 1.25rem 1rem;
          border-radius: 16px;
          border: 1px solid #2D2D2D;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        
        .calendar-stats .stat-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          border-color: #FFB333;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: #71717A;
          font-weight: 500;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .stat-value {
          font-size: 1.875rem;
          font-weight: 700;
          color: #FFFFFF;
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
          color: #FFFFFF;
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
          background: #1A1A1A;
          color: #FFFFFF;
          border: 1px solid #2D2D2D;
          padding: 0.75rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .nav-btn:hover {
          background: #1F1F1F;
          border-color: #FFB333;
          color: #FFB333;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        }
        
        .nav-btn:active {
          transform: translateY(0);
        }
        
        .month-year {
          font-size: 1.5rem;
          font-weight: 600;
          color: #FFFFFF;
          min-width: 200px;
          text-align: center;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          letter-spacing: -0.01em;
        }
        .calendar-content {
          padding: 2rem;
          max-width: ${W?"none":"1200px"};
          margin: 0 auto;
          display: block;
          visibility: visible;
          width: ${W?"100%":"auto"};
        }
        
        .calendar-grid {
          background: transparent;
          padding: 0.5rem 0;
        }
        
        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.75rem;
          padding: 0 1rem 0.5rem 1rem;
        }
        
        .calendar-header-cell {
          padding: 0.5rem;
          text-align: center;
          font-weight: 600;
          color: #71717A;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
          .calendar-body {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0.75rem;
            padding: 1rem;
          }
        .calendar-cell {
          min-height: 140px;
          padding: 1rem;
          background: #141414;
          border: 1px solid #2D2D2D;
          border-radius: 20px;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .calendar-cell:hover {
          background: #1A1A1A;
          border-color: #3D3D3D;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        
        .calendar-cell.other-month {
          background: #0D0D0D;
          color: #52525B;
          opacity: 0.6;
        }
        
        .calendar-cell.today {
          background: #141414;
          border: 2px solid #3B82F6;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
          position: relative;
        }
        
        .day-number {
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 0.75rem;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          font-size: 1.5rem;
        }
        
        .calendar-cell.other-month .day-number {
          color: #52525B;
        }
        
        .calendar-cell.today .day-number {
          color: #3B82F6;
          font-weight: 800;
        }
          .events-container {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
        .task-item {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          border: none;
          border-radius: 12px;
          padding: 0.625rem 0.75rem;
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .task-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        
        .task-item.important {
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
        }
        
        .task-item.important:hover {
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }
        
        .task-item.overdue {
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
        }
        
        .task-item.overdue:hover {
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }
          .task-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.25rem;
          }
        .task-name {
          font-weight: 500;
          color: #FFFFFF;
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
            color: #71717A;
          }
        .more-tasks {
          background: #2D2D2D;
          border: 1px solid #3D3D3D;
          border-radius: 6px;
          padding: 0.375rem 0.5rem;
          font-size: 0.6875rem;
          color: #A1A1AA;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
        }
        
        .more-tasks:hover {
          background: #3D3D3D;
          border-color: #FFB333;
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
            background: #1A1A1A;
            border: 2px solid #2D2D2D;
            border-radius: 12px;
            width: 100%;
            max-width: 900px;
            height: 85vh;
            max-height: 85vh;
            min-height: 600px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
            overflow: hidden;
          }
          .task-details-section {
            padding: 1.5rem;
            border-bottom: 2px solid #2D2D2D;
            flex-shrink: 0;
            max-height: 60%;
            overflow-y: auto;
          }
          .interaction-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 250px;
            background: #1A1A1A;
          }
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 1.5rem;
            border-bottom: 2px solid #2D2D2D;
            background: #141414;
          }
          .modal-header h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #FFFFFF;
            margin: 0;
            flex: 1;
            line-height: 1.3;
          }
          .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            font-weight: bold;
            color: #71717A;
            cursor: pointer;
            padding: 0;
            margin-left: 1rem;
            transition: all 0.2s ease;
          }
          .close-btn:hover {
            color: #FFFFFF;
          }
          /* Tab Navigation */
          .tab-navigation {
            display: flex;
            border-bottom: 2px solid #2D2D2D;
            background: #141414;
            flex-shrink: 0;
            z-index: 1;
          }
          .tab-btn {
            flex: 1;
            padding: 1rem 1.5rem;
            background: none;
            border: none;
            border-right: 1px solid #2D2D2D;
            font-weight: 600;
            color: #71717A;
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
            background: #2D2D2D;
            color: #FFFFFF;
          }
          .tab-btn.active {
            background: #1A1A1A;
            color: #FFFFFF;
            border-bottom: 3px solid #3B82F6;
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
            color: #71717A;
          }
          .empty-comments p, .empty-files p {
            margin: 0.5rem 0;
          }
          .comment-item {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #2D2D2D;
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
            background: linear-gradient(135deg, #2D2D2D 0%, #3D3D3D 100%);
            border: 2px solid #3B82F6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: 600;
            color: #FFFFFF;
            flex-shrink: 0;
          }
          .comment-meta {
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
          }
          .author-name {
            font-weight: 600;
            color: #FFFFFF;
            font-size: 0.875rem;
          }
          .comment-time {
            font-size: 0.75rem;
            color: #71717A;
          }
          .comment-content {
            margin-left: 2.75rem;
            font-size: 0.875rem;
            color: #E4E4E7;
            line-height: 1.5;
          }
          .add-comment {
            border-top: 1px solid #2D2D2D;
            padding: 1.5rem;
            background: #141414;
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
            border: 2px solid #2D2D2D;
            border-radius: 8px;
            font-size: 0.875rem;
            line-height: 1.4;
            resize: vertical;
            min-height: 80px;
            max-width: 100%;
            width: 100%;
            box-sizing: border-box;
            transition: all 0.2s ease;
            background: #1A1A1A;
            color: #FFFFFF;
          }
          .comment-input:focus {
            outline: none;
            border-color: #3B82F6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          }
          .send-comment-btn {
            background: #3B82F6;
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
            background: #2563EB;
            transform: translateY(-1px);
          }
          .send-comment-btn:disabled {
            background: #3D3D3D;
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
            border-bottom: 1px solid #2D2D2D;
            background: #141414;
          }
          .files-header h4 {
            font-size: 1rem;
            font-weight: 600;
            color: #FFFFFF;
            margin: 0;
          }
          .upload-btn {
            background: #3B82F6;
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
            background: #2563EB;
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
            border: 1px solid #2D2D2D;
            border-radius: 8px;
            margin-bottom: 0.75rem;
            transition: all 0.2s ease;
          }
          .file-item:hover {
            border-color: #3B82F6;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          }
          .file-item:last-child {
            margin-bottom: 0;
          }
          .file-icon {
            width: 40px;
            height: 40px;
            background: #2D2D2D;
            border: 1px solid #3D3D3D;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #71717A;
            flex-shrink: 0;
          }
          .file-info {
            flex: 1;
            min-width: 0;
          }
          .file-name {
            font-weight: 600;
            color: #FFFFFF;
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
            word-break: break-all;
          }
          .file-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.75rem;
            color: #71717A;
          }
          .file-actions {
            display: flex;
            gap: 0.5rem;
          }
          .download-btn {
            background: #1A1A1A;
            color: #71717A;
            border: 1px solid #3D3D3D;
            padding: 0.5rem;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.2s ease;
          }
          .download-btn:hover {
            color: #FFFFFF;
            border-color: #3B82F6;
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
          .status-todo { background: #2D2D2D; color: #FFFFFF; border-color: #3D3D3D; }
          .status-in_progress { background: #3D3D3D; color: #FFFFFF; border-color: #3B82F6; }
          .status-review { background: #52525B; color: #ffffff; border-color: #A1A1AA; }
          .status-done { background: #10B981; color: #ffffff; border-color: #10B981; }
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
          .priority-low { background: #2D2D2D; color: #FFFFFF; border-color: #3D3D3D; }
          .priority-medium { background: #3D3D3D; color: #FFFFFF; border-color: #52525B; }
          .priority-high { background: #71717A; color: #ffffff; border-color: #A1A1AA; }
          .priority-urgent { background: #F87239; color: #ffffff; border-color: #F87239; }
          .description {
            margin-bottom: 1.5rem;
          }
          .description h4 {
            font-size: 0.9rem;
            font-weight: 600;
            color: #FFFFFF;
            margin: 0 0 0.5rem 0;
          }
          .description p {
            font-size: 0.875rem;
            color: #E4E4E7;
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
            color: #71717A;
            min-width: 80px;
          }
          .meta-item .value {
            font-size: 0.8rem;
            color: #FFFFFF;
            text-align: right;
            flex: 1;
          }
          .meta-item .value.overdue {
            color: #F87239;
            font-weight: 600;
          }
          .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
            justify-content: flex-end;
          }
          .tag {
            background: #2D2D2D;
            color: #E4E4E7;
            padding: 0.2rem 0.5rem;
            border-radius: 12px;
            font-size: 0.7rem;
            display: flex;
            align-items: center;
            gap: 0.2rem;
            border: 1px solid #3D3D3D;
          }

          .status-change-section {
            background: #141414;
            border: 1px solid #2D2D2D;
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 1rem;
          }
          .status-change-title {
            font-weight: 600;
            color: #FFFFFF;
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
            border: 2px solid #3D3D3D;
            border-radius: 6px;
            background: #1A1A1A;
            color: #FFFFFF;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
            font-size: 0.875rem;
          }
          .status-change-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
            border-color: #3B82F6;
          }
          .status-change-btn.active {
            background: #3B82F6;
            color: #ffffff;
            border-color: #3B82F6;
          }
          .status-change-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          /* Modal Splitter Styles */
          .modal-splitter {
            height: 8px;
            background: linear-gradient(to bottom, #2D2D2D 0%, #3D3D3D 50%, #2D2D2D 100%);
            border-top: 1px solid #3D3D3D;
            border-bottom: 1px solid #3D3D3D;
            cursor: ns-resize;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            user-select: none;
          }
          .modal-splitter:hover {
            background: linear-gradient(to bottom, #3D3D3D 0%, #52525B 50%, #3D3D3D 100%);
            border-color: #52525B;
          }
          .modal-splitter.dragging {
            background: linear-gradient(to bottom, #3b82f6 0%, #1d4ed8 50%, #3b82f6 100%);
            border-color: #1d4ed8;
          }
          .splitter-handle {
            width: 40px;
            height: 4px;
            background: #52525B;
            border-radius: 2px;
            transition: all 0.2s ease;
          }
          .modal-splitter:hover .splitter-handle {
            background: #71717A;
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
              background: #0D0D0D;
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
              background: #141414;
              border-bottom: 1px solid #2D2D2D;
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
              color: #FFFFFF;
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
              background: rgba(26, 26, 26, 0.95);
              border: 1px solid #2D2D2D;
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
              color: #71717A;
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
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
              border: 1px solid #2D2D2D;
              width: calc(100vw - 1rem) !important;
              max-width: calc(100vw - 1rem) !important;
              box-sizing: border-box;
              display: block !important;
              visibility: visible !important;
              margin: 0 !important;
            }
            
            /* Mobile Calendar Header */
            .calendar-header {
              background: #1A1A1A;
              padding: 0;
              display: grid !important;
              grid-template-columns: repeat(7, 1fr) !important;
              width: 100% !important;
            }
            .calendar-header-cell {
              color: #E4E4E7;
              font-weight: 700;
              font-size: 0.75rem;
              text-align: center;
              padding: 0.75rem 0.125rem;
              border-right: 1px solid #2D2D2D;
              box-sizing: border-box;
              overflow: hidden;
            }
            .calendar-header-cell:last-child {
              border-right: none;
            }
            
            /* Mobile Calendar Body */
            .calendar-body {
              background: #141414;
              display: grid !important;
              grid-template-columns: repeat(7, 1fr) !important;
              width: 100%;
              visibility: visible !important;
            }
            .calendar-cell {
              min-height: 85px;
              padding: 0.375rem;
              border-right: 1px solid #2D2D2D;
              border-bottom: 1px solid #2D2D2D;
              background: #141414;
              transition: all 0.2s ease;
              position: relative;
              display: flex;
              flex-direction: column;
              box-sizing: border-box;
              overflow: hidden;
            }
            .calendar-cell:hover {
              background: #1A1A1A;
              border-color: #3D3D3D;
            }
            .calendar-cell:nth-child(7n) {
              border-right: none;
            }
            .calendar-cell.other-month {
              background: #1A1A1A;
              opacity: 0.6;
            }
            .calendar-cell.other-month .day-number {
              color: #52525B;
            }
            .calendar-cell.today {
              background: linear-gradient(135deg, #2D2D2D 0%, #3D3D3D 100%);
              border: 2px solid #FFB333;
              box-shadow: 0 0 0 1px rgba(255, 179, 51, 0.3);
            }
            .calendar-cell.today .day-number {
              color: #FFB333;
              font-weight: 800;
            }
            .day-number {
              font-size: 0.8rem;
              font-weight: 700;
              color: #FFFFFF;
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
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
              border-color: rgba(59, 130, 246, 0.3);
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
              color: #FFFFFF;
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
              color: #71717A;
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
              color: #71717A;
            }
            .more-tasks {
              padding: 0.1875rem;
              font-size: 0.55rem;
              border-radius: 3px;
              background: linear-gradient(135deg, #2D2D2D 0%, #3D3D3D 100%);
              color: #71717A;
              text-align: center;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              border: 1px solid #3D3D3D;
              margin-top: 0.125rem;
            }
            .more-tasks:hover {
              background: linear-gradient(135deg, #3D3D3D 0%, #52525B 100%);
              color: #E4E4E7;
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
              background: rgba(0, 0, 0, 0.8);
            }
            .enhanced-task-modal {
              margin: 0;
              width: 100%;
              max-width: calc(100vw - 1.5rem);
              max-height: calc(100vh - 1.5rem);
              height: auto;
              min-height: 80vh;
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
              display: flex;
              flex-direction: column;
              overflow: hidden;
            }
            .modal-header {
              padding: 1rem;
              border-bottom: 1px solid #2D2D2D;
              background: #141414;
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
              background: #1A1A1A;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid #2D2D2D;
            }
            .task-details-section {
              padding: 1rem;
              flex: 1;
              overflow-y: auto;
              background: #1A1A1A;
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
              border-bottom: 1px solid #2D2D2D;
            }
            .meta-item:last-child {
              border-bottom: none;
            }
            .meta-item .label {
              font-size: 0.7rem;
              color: #71717A;
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
              color: #F87239;
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
              background: #2D2D2D;
              border-radius: 12px;
              border: 1px solid #3D3D3D;
            }
            .status-change-section {
              background: #141414;
              border: 1px solid #2D2D2D;
              border-radius: 8px;
              padding: 1rem;
              margin-top: 1rem;
            }
            .status-change-title {
              font-size: 0.85rem;
              font-weight: 600;
              margin-bottom: 0.75rem;
              color: #FFFFFF;
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
              background: #2D2D2D;
              cursor: ns-resize;
            }
            .splitter-handle {
              width: 40px;
              height: 3px;
              background: #52525B;
            }
            
            /* Mobile Tab Navigation */
            .tab-navigation {
              overflow-x: auto;
              scrollbar-width: none;
              -ms-overflow-style: none;
              background: #141414;
              border-bottom: 1px solid #2D2D2D;
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
              background: #141414;
              border-top: 1px solid #2D2D2D;
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
              border: 2px solid #2D2D2D;
              resize: vertical;
            }
            .comment-input:focus {
              border-color: #3B82F6;
              outline: none;
            }
            .send-comment-btn {
              align-self: stretch;
              padding: 0.875rem;
              justify-content: center;
              font-size: 0.85rem;
              min-height: 44px;
              background: #3B82F6;
              color: #ffffff;
              border: none;
              border-radius: 8px;
              font-weight: 600;
            }
            .files-header {
              padding: 1rem;
              background: #141414;
              border-bottom: 1px solid #2D2D2D;
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
              background: #3B82F6;
              color: #ffffff;
              border: none;
              border-radius: 6px;
              font-weight: 500;
            }
            .file-item {
              padding: 0.875rem;
              border-bottom: 1px solid #2D2D2D;
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
              background: #2D2D2D;
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
              color: #71717A;
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
              background: #1A1A1A;
              border: 1px solid #2D2D2D;
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
        `}}),(0,n.jsxs)("div",{className:"calendar-container",children:[n.jsx(k.Z,{projects:_,onCreateProject:()=>{}}),(0,n.jsxs)("div",{className:"page-main main-content",children:[(0,n.jsxs)("header",{className:"header",children:[(0,n.jsxs)("div",{className:"header-content",children:[(0,n.jsxs)("h1",{className:"header-title",children:[n.jsx(m.Z,{style:{width:"32px",height:"32px"}}),"Meeting Schedule"]}),(0,n.jsxs)("div",{className:"header-controls",children:[n.jsx("div",{style:{display:"flex",background:"#1A1A1A",borderRadius:"8px",padding:"4px",border:"1px solid #2D2D2D",gap:"2px"},children:[{key:"month",label:"Month"},{key:"week",label:"Week"}].map(({key:e,label:t})=>n.jsx("button",{onClick:()=>ei(e),style:{padding:"8px 16px",borderRadius:"6px",border:"none",background:en===e?"#3B82F6":"transparent",color:en===e?"#FFFFFF":"#71717A",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",transition:"all 0.2s ease",minWidth:"70px"},onMouseEnter:t=>{en!==e&&(t.currentTarget.style.background="#2D2D2D",t.currentTarget.style.color="#FFFFFF")},onMouseLeave:t=>{en!==e&&(t.currentTarget.style.background="transparent",t.currentTarget.style.color="#71717A")},children:t},e))}),(0,n.jsxs)("div",{className:"calendar-nav",children:[n.jsx("button",{onClick:"week"===en?()=>{let e=new Date(N);e.setDate(N.getDate()-7),R(e)}:()=>{R(new Date(N.getFullYear(),N.getMonth()-1))},className:"nav-btn",children:n.jsx(c.Z,{style:{width:"20px",height:"20px"}})}),n.jsx("div",{className:"month-year",children:"week"===en?`Week: ${eo[N.getMonth()]}`:`${eo[N.getMonth()]} ${N.getFullYear()}`}),n.jsx("button",{onClick:"week"===en?()=>{let e=new Date(N);e.setDate(N.getDate()+7),R(e)}:()=>{R(new Date(N.getFullYear(),N.getMonth()+1))},className:"nav-btn",children:n.jsx(p.Z,{style:{width:"20px",height:"20px"}})})]}),n.jsx("div",{className:"today-nav",children:n.jsx("button",{onClick:()=>R(new Date),className:"today-btn",style:{background:"#3b82f6",color:"#ffffff",border:"none",padding:"0.75rem 1.5rem",borderRadius:"8px",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",transition:"all 0.2s ease"},children:"Today"})})]})]}),(0,n.jsxs)("div",{className:"calendar-stats",children:[(0,n.jsxs)("div",{className:"stat-item",children:[n.jsx("span",{className:"stat-label",children:"Total Meetings"}),n.jsx("span",{className:"stat-value",children:C.length})]}),(0,n.jsxs)("div",{className:"stat-item",children:[n.jsx("span",{className:"stat-label",children:"This Week"}),n.jsx("span",{className:"stat-value",children:C.filter(e=>{let t=new Date(e.due_date||e.start_date||""),r=new Date(ev);r.setDate(ev.getDate()-ev.getDay());let n=new Date(r);return n.setDate(r.getDate()+6),t>=r&&t<=n}).length})]}),(0,n.jsxs)("div",{className:"stat-item",children:[n.jsx("span",{className:"stat-label",children:"Today"}),n.jsx("span",{className:"stat-value",children:ed(ev).length})]}),(0,n.jsxs)("div",{className:"stat-item",children:[n.jsx("span",{className:"stat-label",children:"Upcoming"}),n.jsx("span",{className:"stat-value",children:C.filter(e=>{let t=new Date(e.due_date||e.start_date||"");return t>ev}).length})]})]})]}),(0,n.jsxs)("main",{className:"calendar-content",children:["month"===en?(0,n.jsxs)("div",{className:"calendar-grid",children:[n.jsx("div",{className:"calendar-header",children:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(e=>n.jsx("div",{className:"calendar-header-cell",children:e},e))}),(0,n.jsxs)("div",{className:"calendar-body",children:[Array.from({length:ej},(e,t)=>n.jsx("div",{style:{minHeight:"140px"}},`empty-${t}`)),Array.from({length:ek},(e,t)=>{let r=t+1,i=new Date(N.getFullYear(),N.getMonth(),r),a=N.getMonth()===ev.getMonth()&&N.getFullYear()===ev.getFullYear()&&r===ev.getDate(),o=ed(i);return(0,n.jsxs)("div",{className:`calendar-cell ${a?"today":""}`,onClick:()=>em(i),children:[n.jsx("div",{className:"day-number",children:r}),(0,n.jsxs)("div",{className:"events-container",children:[(o||[]).slice(0,3).map(e=>(0,n.jsxs)("div",{className:`task-item ${e.is_important?"important":""} ${ef(e.due_date)?"overdue":""}`,onClick:t=>{t.stopPropagation(),ey(e)},children:[(0,n.jsxs)("div",{className:"task-header",children:[n.jsx("span",{className:"task-name",children:e.name}),n.jsx("div",{className:"task-icons",children:eu(e.priority)})]}),(0,n.jsxs)("div",{className:"task-meta",children:[n.jsx("span",{className:"project-name",style:{color:"#FFFFFF"},children:e.project_name}),e.assignee&&(0,n.jsxs)("span",{className:"assignee",children:[n.jsx(g.Z,{style:{width:"10px",height:"10px"}}),e.assignee.name?e.assignee.name.split(" ")[0]:"Unknown"]})]})]},e.id)),(o||[]).length>3&&(0,n.jsxs)("div",{className:"more-tasks",onClick:e=>{e.stopPropagation(),ew(i,o||[])},style:{cursor:"pointer"},children:["+",(o||[]).length-3," more"]})]})]},r)})]})]}):"week"===en?n.jsx("div",{style:{padding:"2rem",maxWidth:"1400px",margin:"0 auto"},children:n.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",gap:"1rem",marginBottom:"2rem"},children:Array.from({length:7}).map((e,t)=>{let r=new Date(N);r.setDate(N.getDate()-N.getDay()+t);let i=ed(r),a=r.toDateString()===ev.toDateString(),o=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][t],s=r.getDate();return(0,n.jsxs)("div",{onClick:()=>em(r),style:{background:"#141414",borderRadius:"24px",padding:"1.5rem",minHeight:"280px",border:a?"2px solid #3B82F6":"1px solid #2D2D2D",transition:"all 0.3s ease",display:"flex",flexDirection:"column",cursor:"pointer"},onMouseEnter:e=>{a||(e.currentTarget.style.borderColor="#3D3D3D")},onMouseLeave:e=>{a||(e.currentTarget.style.borderColor="#2D2D2D")},children:[n.jsx("div",{style:{fontSize:"0.75rem",fontWeight:600,color:"#71717A",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"0.5rem"},children:o.slice(0,3)}),n.jsx("div",{style:{fontSize:"2rem",fontWeight:700,color:a?"#3B82F6":"#FFFFFF",marginBottom:"1rem"},children:s}),(0,n.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem",flex:1},children:[i.slice(0,4).map(e=>(0,n.jsxs)("div",{onClick:t=>{t.stopPropagation(),ey(e)},style:{background:"high"===e.priority?"linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)":"urgent"===e.priority?"linear-gradient(135deg, #EF4444 0%, #DC2626 100%)":"linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",padding:"0.75rem",borderRadius:"12px",cursor:"pointer",transition:"all 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.transform="translateY(-2px)",e.currentTarget.style.boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)"},onMouseLeave:e=>{e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="none"},children:[n.jsx("div",{style:{fontSize:"0.8125rem",fontWeight:600,color:"#FFFFFF",marginBottom:"0.25rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:e.name}),e.start_date&&(0,n.jsxs)("div",{style:{fontSize:"0.6875rem",color:"rgba(255,255,255,0.8)",fontWeight:500},children:["@ ",new Date(e.start_date).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0})]})]},e.id)),i.length>4&&(0,n.jsxs)("div",{style:{fontSize:"0.75rem",color:"#71717A",textAlign:"center",padding:"0.5rem",cursor:"pointer"},onClick:e=>{e.stopPropagation(),ew(r,i)},children:["+",i.length-4," more"]})]})]},t)})})}):null,Z&&P&&n.jsx(j.Z,{meeting:P,onClose:()=>{Y(!1),L(null)},onUpdate:eF,onDelete:eD,projectMembers:et,projects:_,onProjectChange:ec}),$&&H&&n.jsx("div",{className:"modal-overlay",onClick:()=>{q(!1),G(null),O([])},children:(0,n.jsxs)("div",{className:"enhanced-task-modal",onClick:e=>e.stopPropagation(),children:[(0,n.jsxs)("div",{className:"modal-header",children:[(0,n.jsxs)("h3",{children:["Tasks for ",H.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})]}),n.jsx("button",{type:"button",onClick:()=>{q(!1),G(null),O([])},className:"close-btn",children:"\xd7"})]}),n.jsx("div",{className:"task-details-section",style:{maxHeight:"100%",overflow:"auto"},children:0===U.length?n.jsx("div",{className:"empty-comments",children:n.jsx("p",{children:"No tasks scheduled for this day"})}):n.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"1rem"},children:U.map(e=>(0,n.jsxs)("div",{className:"task-item",style:{padding:"1rem",border:"2px solid #2D2D2D",borderRadius:"8px",background:"#1A1A1A",cursor:"pointer",transition:"all 0.2s ease",borderLeft:`4px solid ${eb(e.status)}`},onClick:()=>{q(!1),G(null),O([]),ey(e)},onMouseOver:e=>{e.currentTarget.style.background="#1F1F1F",e.currentTarget.style.borderColor="#3B82F6"},onMouseOut:e=>{e.currentTarget.style.background="#1A1A1A",e.currentTarget.style.borderColor="#2D2D2D"},children:[(0,n.jsxs)("div",{className:"task-status-row",children:[n.jsx("span",{className:`status-badge status-${e.status}`,children:e.status.replace("_"," ")}),(0,n.jsxs)("span",{className:`priority-badge priority-${e.priority}`,children:[eu(e.priority),e.priority]})]}),(0,n.jsxs)("div",{style:{marginBottom:"0.75rem"},children:[n.jsx("h4",{style:{margin:0,fontSize:"1rem",fontWeight:"600",color:"#FFFFFF"},children:e.name}),n.jsx("p",{style:{margin:"0.25rem 0 0 0",fontSize:"0.875rem",color:"#A1A1AA"},children:e.project_name})]}),e.description&&n.jsx("p",{style:{margin:"0.5rem 0",fontSize:"0.875rem",color:"#E4E4E7",lineHeight:"1.4"},children:e.description}),(0,n.jsxs)("div",{className:"task-metadata",children:[e.assignee&&(0,n.jsxs)("div",{className:"meta-item",children:[n.jsx("span",{className:"label",children:"Assigned to:"}),n.jsx("span",{className:"value",children:e.assignee.name})]}),e.estimated_hours&&(0,n.jsxs)("div",{className:"meta-item",children:[n.jsx("span",{className:"label",children:"Estimated:"}),(0,n.jsxs)("span",{className:"value",children:[e.estimated_hours,"h"]})]}),e.tags_list&&e.tags_list.length>0&&(0,n.jsxs)("div",{className:"meta-item",children:[n.jsx("span",{className:"label",children:"Tags:"}),n.jsx("div",{className:"tags",children:e.tags_list.map((e,t)=>n.jsx("span",{className:"tag",children:e},t))})]})]})]},e.id))})})]})}),J&&n.jsx("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100},onClick:()=>V(!1),children:(0,n.jsxs)("div",{style:{background:"#1A1A1A",borderRadius:"16px",width:"600px",maxWidth:"90vw",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column"},onClick:e=>e.stopPropagation(),children:[(0,n.jsxs)("div",{style:{background:"linear-gradient(135deg, #FF9A6C 0%, #C77DFF 100%)",padding:"24px",position:"relative"},children:[n.jsx("button",{onClick:()=>V(!1),style:{position:"absolute",top:"16px",right:"16px",background:"transparent",border:"none",color:"#FFFFFF",cursor:"pointer",padding:"4px"},children:n.jsx(x.Z,{style:{width:"24px",height:"24px"}})}),n.jsx("h3",{style:{color:"#FFFFFF",fontSize:"1.5rem",fontWeight:700,marginBottom:"4px",marginTop:0},children:"Schedule Meeting"}),H&&n.jsx("div",{style:{fontSize:"0.875rem",color:"#FFFFFF",opacity:.9},children:H.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})})]}),(0,n.jsxs)("div",{style:{padding:"24px",overflowY:"auto",flex:1,background:"#141414"},children:[(0,n.jsxs)("div",{style:{marginBottom:"20px"},children:[(0,n.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"8px",color:"#E4E4E7",fontSize:"0.875rem",fontWeight:600,marginBottom:"8px"},children:[n.jsx(h.Z,{style:{width:"18px",height:"18px",color:"#FF9A6C"}}),"Meeting Title *"]}),n.jsx("input",{type:"text",value:K.title,onChange:e=>X({...K,title:e.target.value}),placeholder:"Enter meeting title",style:{width:"100%",padding:"12px 14px",background:"#141414",border:"1px solid #3D3D3D",borderRadius:"8px",color:"#FFFFFF",fontSize:"0.9375rem",outline:"none"},onFocus:e=>e.currentTarget.style.borderColor="#C77DFF",onBlur:e=>e.currentTarget.style.borderColor="#3D3D3D"})]}),(0,n.jsxs)("div",{style:{marginBottom:"20px"},children:[(0,n.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"8px",color:"#E4E4E7",fontSize:"0.875rem",fontWeight:600,marginBottom:"8px"},children:[n.jsx(u.Z,{style:{width:"18px",height:"18px",color:"#FF9A6C"}}),"Project"]}),(0,n.jsxs)("select",{value:K.project_id||"",onChange:e=>ec(e.target.value?parseInt(e.target.value):null),style:{width:"100%",padding:"12px 14px",background:"#141414",border:"1px solid #3D3D3D",borderRadius:"8px",color:"#FFFFFF",fontSize:"0.9375rem",outline:"none",cursor:"pointer"},onFocus:e=>e.currentTarget.style.borderColor="#C77DFF",onBlur:e=>e.currentTarget.style.borderColor="#3D3D3D",children:[n.jsx("option",{value:"",children:"Select a project"}),_.map(e=>n.jsx("option",{value:e.id,children:e.name},e.id))]})]}),(0,n.jsxs)("div",{style:{marginBottom:"20px"},children:[(0,n.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"8px",color:"#E4E4E7",fontSize:"0.875rem",fontWeight:600,marginBottom:"8px"},children:[n.jsx(b.Z,{style:{width:"18px",height:"18px",color:"#FF9A6C"}}),"Description"]}),n.jsx("textarea",{value:K.description,onChange:e=>X({...K,description:e.target.value}),placeholder:"Add meeting description...",rows:3,style:{width:"100%",padding:"12px 14px",background:"#141414",border:"1px solid #3D3D3D",borderRadius:"8px",color:"#FFFFFF",fontSize:"0.9375rem",outline:"none",resize:"vertical"},onFocus:e=>e.currentTarget.style.borderColor="#C77DFF",onBlur:e=>e.currentTarget.style.borderColor="#3D3D3D"})]}),(0,n.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px",marginBottom:"20px"},children:[(0,n.jsxs)("div",{children:[(0,n.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"6px",color:"#E4E4E7",fontSize:"0.875rem",fontWeight:600,marginBottom:"8px"},children:[n.jsx(m.Z,{style:{width:"16px",height:"16px",color:"#C77DFF"}}),"Date"]}),n.jsx("input",{type:"date",value:K.start_date,onChange:e=>X({...K,start_date:e.target.value}),style:{width:"100%",padding:"12px 14px",background:"#141414",border:"1px solid #3D3D3D",borderRadius:"8px",color:"#FFFFFF",fontSize:"0.875rem",outline:"none"},onFocus:e=>e.currentTarget.style.borderColor="#C77DFF",onBlur:e=>e.currentTarget.style.borderColor="#3D3D3D"})]}),(0,n.jsxs)("div",{children:[(0,n.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"6px",color:"#E4E4E7",fontSize:"0.875rem",fontWeight:600,marginBottom:"8px"},children:[n.jsx(d.Z,{style:{width:"16px",height:"16px",color:"#C77DFF"}}),"Time"]}),n.jsx("input",{type:"time",value:K.start_time,onChange:e=>X({...K,start_time:e.target.value}),style:{width:"100%",padding:"12px 14px",background:"#141414",border:"1px solid #3D3D3D",borderRadius:"8px",color:"#FFFFFF",fontSize:"0.875rem",outline:"none"},onFocus:e=>e.currentTarget.style.borderColor="#C77DFF",onBlur:e=>e.currentTarget.style.borderColor="#3D3D3D"})]}),(0,n.jsxs)("div",{children:[(0,n.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"6px",color:"#E4E4E7",fontSize:"0.875rem",fontWeight:600,marginBottom:"8px"},children:[n.jsx(d.Z,{style:{width:"16px",height:"16px",color:"#C77DFF"}}),"Duration"]}),(0,n.jsxs)("div",{style:{position:"relative"},children:[n.jsx("input",{type:"number",value:K.duration,onChange:e=>X({...K,duration:parseInt(e.target.value)||60}),min:"15",step:"15",style:{width:"100%",padding:"12px 14px",paddingRight:"45px",background:"#141414",border:"1px solid #3D3D3D",borderRadius:"8px",color:"#FFFFFF",fontSize:"0.875rem",outline:"none"},onFocus:e=>e.currentTarget.style.borderColor="#C77DFF",onBlur:e=>e.currentTarget.style.borderColor="#3D3D3D"}),n.jsx("span",{style:{position:"absolute",right:"14px",top:"50%",transform:"translateY(-50%)",color:"#71717A",fontSize:"0.875rem",pointerEvents:"none"},children:"min"})]})]})]}),(0,n.jsxs)("div",{style:{marginBottom:"20px",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"#141414",border:"1px solid #3D3D3D",borderRadius:"8px"},children:[(0,n.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"8px",color:"#E4E4E7",fontSize:"0.875rem",fontWeight:600},children:[n.jsx(f.Z,{style:{width:"18px",height:"18px",color:"#FF9A6C"}}),"Recurring Meeting"]}),n.jsx("div",{onClick:()=>X({...K,recurring:!K.recurring}),style:{width:"48px",height:"24px",background:K.recurring?"#C77DFF":"#3D3D3D",borderRadius:"12px",position:"relative",cursor:"pointer",transition:"background 0.2s"},children:n.jsx("div",{style:{width:"20px",height:"20px",background:"#FFFFFF",borderRadius:"50%",position:"absolute",top:"2px",left:K.recurring?"26px":"2px",transition:"left 0.2s"}})})]}),(0,n.jsxs)("div",{style:{marginBottom:"20px"},children:[(0,n.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"8px",color:"#E4E4E7",fontSize:"0.875rem",fontWeight:600,marginBottom:"12px"},children:[n.jsx(y.Z,{style:{width:"18px",height:"18px",color:"#C77DFF"}}),"Attendees"]}),n.jsx("div",{style:{background:"#141414",border:"1px solid #3D3D3D",borderRadius:"8px",padding:"12px"},children:K.project_id?0===et.length?n.jsx("p",{style:{color:"#71717A",fontSize:"0.875rem",margin:0,fontStyle:"italic"},children:"No team members found for this project"}):n.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"8px"},children:et.map(e=>(0,n.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"12px",cursor:"pointer",padding:"8px",borderRadius:"6px",transition:"background 0.2s"},onMouseEnter:e=>e.currentTarget.style.background="#2D2D2D",onMouseLeave:e=>e.currentTarget.style.background="transparent",children:[n.jsx("input",{type:"checkbox",checked:K.attendee_ids.includes(e.id),onChange:t=>{t.target.checked?X({...K,attendee_ids:[...K.attendee_ids,e.id]}):X({...K,attendee_ids:K.attendee_ids.filter(t=>t!==e.id)})},style:{width:"18px",height:"18px",cursor:"pointer"}}),n.jsx("div",{style:{width:"32px",height:"32px",borderRadius:"50%",background:"#C77DFF",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFFFFF",fontSize:"0.875rem",fontWeight:600},children:e.name?.charAt(0)?.toUpperCase()||e.email?.charAt(0)?.toUpperCase()||"U"}),(0,n.jsxs)("div",{style:{flex:1},children:[n.jsx("div",{style:{color:"#FFFFFF",fontSize:"0.875rem",fontWeight:500},children:e.name||"Unknown User"}),n.jsx("div",{style:{color:"#71717A",fontSize:"0.75rem"},children:e.email})]})]},e.id))}):n.jsx("p",{style:{color:"#71717A",fontSize:"0.875rem",margin:0,fontStyle:"italic"},children:"Select a project first to see team members"})})]}),(0,n.jsxs)("div",{style:{marginBottom:"20px"},children:[(0,n.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"8px",color:"#E4E4E7",fontSize:"0.875rem",fontWeight:600,marginBottom:"12px"},children:[n.jsx(F.Z,{style:{width:"18px",height:"18px",color:"#3B82F6"}}),"Meeting Agenda"]}),n.jsx("div",{style:{background:"rgba(251, 191, 36, 0.1)",border:"1px solid #FCD34D",borderRadius:"8px",padding:"12px",marginBottom:"12px",fontSize:"0.875rem",color:"#FCD34D"},children:"\uD83D\uDCA1 Add agenda items to keep your meeting focused"}),(0,n.jsxs)("div",{style:{display:"flex",gap:"8px",marginBottom:"12px"},children:[n.jsx("input",{type:"text",value:Q,onChange:e=>ee(e.target.value),placeholder:"Add an agenda item...",style:{flex:1,padding:"10px 12px",background:"#141414",border:"1px solid #3D3D3D",borderRadius:"8px",color:"#FFFFFF",fontSize:"0.875rem",outline:"none"},onFocus:e=>e.currentTarget.style.borderColor="#C77DFF",onBlur:e=>e.currentTarget.style.borderColor="#3D3D3D",onKeyDown:e=>{"Enter"===e.key&&Q.trim()&&(X({...K,agenda_items:[...K.agenda_items,Q.trim()]}),ee(""))}}),n.jsx("button",{onClick:()=>{Q.trim()&&(X({...K,agenda_items:[...K.agenda_items,Q.trim()]}),ee(""))},style:{padding:"10px 16px",background:"#C77DFF",border:"none",borderRadius:"8px",color:"#FFFFFF",fontSize:"0.875rem",fontWeight:600,cursor:"pointer",transition:"background 0.2s"},onMouseEnter:e=>e.currentTarget.style.background="#B366FF",onMouseLeave:e=>e.currentTarget.style.background="#C77DFF",children:"Add"})]}),K.agenda_items.length>0&&n.jsx("div",{style:{background:"#141414",border:"1px solid #3D3D3D",borderRadius:"8px",padding:"8px"},children:K.agenda_items.map((e,t)=>(0,n.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"8px",padding:"8px",borderRadius:"6px",background:"#2D2D2D",marginBottom:t<K.agenda_items.length-1?"6px":0},children:[n.jsx("div",{style:{width:"24px",height:"24px",borderRadius:"50%",background:"#E0E7FF",display:"flex",alignItems:"center",justifyContent:"center",color:"#4F46E5",fontSize:"0.75rem",fontWeight:600,flexShrink:0},children:t+1}),n.jsx("span",{style:{flex:1,color:"#E4E4E7",fontSize:"0.875rem"},children:e}),n.jsx("button",{onClick:()=>{X({...K,agenda_items:K.agenda_items.filter((e,r)=>r!==t)})},style:{background:"transparent",border:"none",color:"#EF4444",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center"},children:n.jsx(D.Z,{style:{width:"16px",height:"16px"}})})]},t))})]}),(0,n.jsxs)("div",{style:{marginBottom:"20px"},children:[(0,n.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"8px",color:"#E4E4E7",fontSize:"0.875rem",fontWeight:600,marginBottom:"8px"},children:[n.jsx(w,{style:{width:"18px",height:"18px",color:"#10B981"}}),"Meeting Link"]}),n.jsx("input",{type:"url",value:K.meeting_link,onChange:e=>X({...K,meeting_link:e.target.value}),placeholder:"https://zoom.us/j/... or meet.google.com/...",style:{width:"100%",padding:"12px 14px",background:"#141414",border:"1px solid #3D3D3D",borderRadius:"8px",color:"#FFFFFF",fontSize:"0.9375rem",outline:"none"},onFocus:e=>e.currentTarget.style.borderColor="#C77DFF",onBlur:e=>e.currentTarget.style.borderColor="#3D3D3D"})]}),(0,n.jsxs)("div",{style:{marginBottom:"8px"},children:[(0,n.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"8px",color:"#E4E4E7",fontSize:"0.875rem",fontWeight:600,marginBottom:"8px"},children:[n.jsx(v.Z,{style:{width:"18px",height:"18px",color:"#F59E0B"}}),"Email Reminder"]}),(0,n.jsxs)("select",{value:K.reminder_time,onChange:e=>X({...K,reminder_time:e.target.value}),style:{width:"100%",padding:"12px 14px",background:"#141414",border:"1px solid #3D3D3D",borderRadius:"8px",color:"#FFFFFF",fontSize:"0.9375rem",outline:"none",cursor:"pointer"},onFocus:e=>e.currentTarget.style.borderColor="#C77DFF",onBlur:e=>e.currentTarget.style.borderColor="#3D3D3D",children:[n.jsx("option",{value:"15",children:"15 min before"}),n.jsx("option",{value:"30",children:"30 min before"}),n.jsx("option",{value:"60",children:"1 hour before"}),n.jsx("option",{value:"1440",children:"1 day before"})]})]})]}),(0,n.jsxs)("div",{style:{padding:"16px 24px",background:"#141414",borderTop:"1px solid #2D2D2D",display:"flex",gap:"12px",justifyContent:"flex-end"},children:[n.jsx("button",{onClick:()=>V(!1),style:{padding:"10px 20px",background:"#141414",border:"1px solid #3D3D3D",borderRadius:"8px",color:"#E4E4E7",fontSize:"0.875rem",fontWeight:600,cursor:"pointer",transition:"all 0.2s"},onMouseEnter:e=>{e.currentTarget.style.background="#2D2D2D",e.currentTarget.style.borderColor="#71717A"},onMouseLeave:e=>{e.currentTarget.style.background="#141414",e.currentTarget.style.borderColor="#3D3D3D"},children:"Cancel"}),n.jsx("button",{onClick:eh,disabled:!K.title.trim(),style:{padding:"10px 24px",background:K.title.trim()?"linear-gradient(135deg, #FF9A6C 0%, #C77DFF 100%)":"#3D3D3D",border:"none",borderRadius:"8px",color:"#FFFFFF",fontSize:"0.875rem",fontWeight:600,cursor:K.title.trim()?"pointer":"not-allowed",transition:"all 0.2s"},onMouseEnter:e=>{K.title.trim()&&(e.currentTarget.style.opacity="0.9")},onMouseLeave:e=>{K.title.trim()&&(e.currentTarget.style.opacity="1")},children:"Schedule Meeting"})]})]})}),Z&&P&&n.jsx(j.Z,{meeting:P,onClose:()=>{Y(!1),L(null)},onUpdate:eF,onDelete:eD,projectMembers:et,projects:_,onProjectChange:ec})]})]})]})]}):null}},1046:(e,t,r)=>{"use strict";r.r(t),r.d(t,{$$typeof:()=>o,__esModule:()=>a,default:()=>l});var n=r(95153);let i=(0,n.createProxy)(String.raw`/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/calendar/page.tsx`),{__esModule:a,$$typeof:o}=i,s=i.default,l=s},10789:(e,t,r)=>{"use strict";r.d(t,{Z:()=>a});var n=r(34218);let i=n.forwardRef(function({title:e,titleId:t,...r},i){return n.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?n.createElement("title",{id:t},e):null,n.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 19.5 8.25 12l7.5-7.5"}))}),a=i},42150:(e,t,r)=>{"use strict";r.d(t,{Z:()=>a});var n=r(34218);let i=n.forwardRef(function({title:e,titleId:t,...r},i){return n.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?n.createElement("title",{id:t},e):null,n.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"}))}),a=i},44358:(e,t,r)=>{"use strict";r.d(t,{Z:()=>a});var n=r(34218);let i=n.forwardRef(function({title:e,titleId:t,...r},i){return n.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?n.createElement("title",{id:t},e):null,n.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"}))}),a=i},69072:(e,t,r)=>{"use strict";r.d(t,{Z:()=>a});var n=r(34218);let i=n.forwardRef(function({title:e,titleId:t,...r},i){return n.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?n.createElement("title",{id:t},e):null,n.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"}))}),a=i}};var t=require("../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),n=t.X(0,[3271,2977,1323,7490,6512,7609,7068,1111],()=>r(18010));module.exports=n})();