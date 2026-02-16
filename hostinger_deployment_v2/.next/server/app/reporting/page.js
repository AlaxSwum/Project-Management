(()=>{var e={};e.id=8709,e.ids=[8709],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},13685:e=>{"use strict";e.exports=require("http")},95687:e=>{"use strict";e.exports=require("https")},71017:e=>{"use strict";e.exports=require("path")},85477:e=>{"use strict";e.exports=require("punycode")},12781:e=>{"use strict";e.exports=require("stream")},57310:e=>{"use strict";e.exports=require("url")},59796:e=>{"use strict";e.exports=require("zlib")},65709:(e,r,t)=>{"use strict";t.r(r),t.d(r,{GlobalError:()=>o.a,__next_app__:()=>g,originalPathname:()=>m,pages:()=>c,routeModule:()=>p,tree:()=>d});var i=t(67096),a=t(16132),n=t(37284),o=t.n(n),s=t(32564),l={};for(let e in s)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>s[e]);t.d(r,l);let d=["",{children:["reporting",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(t.bind(t,84016)),"/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/reporting/page.tsx"]}]},{metadata:{icon:[async e=>(await Promise.resolve().then(t.bind(t,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(t.bind(t,28835)),"/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(t.t.bind(t,9291,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(t.bind(t,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],c=["/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/reporting/page.tsx"],m="/reporting/page",g={require:t,loadChunk:()=>Promise.resolve()},p=new i.AppPageRouteModule({definition:{kind:a.x.APP_PAGE,page:"/reporting/page",pathname:"/reporting",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},22271:(e,r,t)=>{Promise.resolve().then(t.bind(t,85709))},75548:(e,r,t)=>{"use strict";e.exports=t(67490)},51018:(e,r,t)=>{"use strict";e.exports=t(27804)},85709:(e,r,t)=>{"use strict";t.r(r),t.d(r,{default:()=>d});var i=t(53854),a=t(34218),n=t(51018),o=t(56837),s=t(44937),l=t(66823);function d(){let{user:e,isAuthenticated:r,isLoading:t}=(0,o.useAuth)(),d=(0,n.useRouter)(),[c,m]=(0,a.useState)(null),[g,p]=(0,a.useState)(!0),[f,u]=(0,a.useState)(""),[x,h]=(0,a.useState)(null),[b,v]=(0,a.useState)(!1),[k,y]=(0,a.useState)(!1);(0,a.useEffect)(()=>{let e=()=>{y(window.innerWidth<768)};return e(),window.addEventListener("resize",e),()=>window.removeEventListener("resize",e)},[]),(0,a.useEffect)(()=>{if(!t){if(!r){d.push("/login");return}w()}},[r,t,d]);let w=async()=>{try{p(!0),console.log("Fetching team reporting data for authenticated user");let e=await s.reportingService.getTeamKpiReport();console.log("Generated team report:",e),m(e)}catch(e){u("Failed to fetch reporting data"),console.error("Reporting error:",e)}finally{p(!1)}},j=async e=>{try{console.log("Fetching member detail for:",e);let r=await s.reportingService.getMemberDetailedReport(e);console.log("Generated member detail report:",r),h(r),v(!0)}catch(e){u("Failed to fetch member details"),console.error("Member detail error:",e)}},_=e=>e>=80?"#10b981":e>=60?"#f59e0b":e>=40?"#ef4444":"#6b7280";return t?i.jsx("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F5F5ED"},children:i.jsx("div",{style:{width:"32px",height:"32px",border:"3px solid #C483D9",borderTop:"3px solid #5884FD",borderRadius:"50%",animation:"spin 1s linear infinite"}})}):r?g?i.jsx("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F5F5ED"},children:i.jsx("div",{style:{width:"32px",height:"32px",border:"3px solid #C483D9",borderTop:"3px solid #5884FD",borderRadius:"50%",animation:"spin 1s linear infinite"}})}):(0,i.jsxs)("div",{children:[i.jsx("style",{dangerouslySetInnerHTML:{__html:`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #F5F5ED;
          }
          .reporting-container {
            min-height: 100vh;
            display: flex;
            background: #F5F5ED;
          }
          .main-content {
            flex: 1;
            margin-left: ${k?"0":"256px"};
            background: #F5F5ED;
            padding-top: ${k?"70px":"0"};
            padding-left: ${k?"12px":"0"};
            padding-right: ${k?"12px":"0"};
          }
          .header {
            background: transparent;
            padding: 2rem;
            margin-bottom: 1rem;
          }
          .header-title {
            font-size: 2.5rem;
            font-weight: 300;
            color: #1a1a1a;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            letter-spacing: -0.02em;
          }
          .overview-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
            padding: 0 1rem;
          }
          
          /* Large screens - 5 columns for better spacing */
          @media (min-width: 1400px) {
            .overview-cards {
              grid-template-columns: repeat(5, 1fr);
              gap: 2rem;
            }
          }
          
          /* Medium screens - 3 columns */
          @media (max-width: 1024px) and (min-width: 769px) {
            .overview-cards {
              grid-template-columns: repeat(3, 1fr);
              gap: 1.25rem;
            }
          }
          .overview-card {
            background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
            border: 1px solid #f0f0f0;
            border-radius: 24px;
            padding: 2.5rem 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 0.75rem;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
          }
          .overview-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .overview-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
            border-color: rgba(196, 131, 217, 0.3);
            background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
          }
          .overview-card:hover::before {
            opacity: 1;
          }
          .team-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 1.5rem;
          }
          .member-card {
            background: #ffffff;
            border: 1px solid #e8e8e8;
            border-radius: 16px;
            padding: 2rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
          }
          .member-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border-color: #C483D9;
          }
          .kpi-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin: 1rem 0;
          }
          .kpi-stat {
            text-align: center;
            padding: 1rem;
            border: 1px solid #e8e8e8;
            border-radius: 12px;
            background: #fafafa;
            transition: all 0.2s ease;
          }
          .kpi-stat:hover {
            background: #f0f0f0;
            border-color: #C483D9;
          }
          .progress-bar {
            width: 100%;
            height: 12px;
            background: #f0f0f0;
            border-radius: 8px;
            margin-top: 0.75rem;
            overflow: hidden;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 50;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
          .modal-content {
            background: #ffffff;
            border: 2px solid #e8e8e8;
            border-radius: 24px;
            width: 100%;
            max-width: 1100px;
            max-height: 95vh;
            overflow-y: auto;
            padding: 0;
            box-shadow: 0 32px 64px rgba(0, 0, 0, 0.2);
          }
          /* Mobile Responsive Styles */
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
            }
            
            .header {
              padding: 1rem;
            }
            
            .header-title {
              font-size: 1.5rem;
            }
            
            .team-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            
            .overview-cards {
              grid-template-columns: repeat(2, 1fr);
              gap: 1rem;
            }
            
            .overview-card {
              padding: 1.5rem 1rem;
              gap: 0.75rem;
              border-radius: 20px;
            }
            
            .kpi-stats {
              grid-template-columns: repeat(2, 1fr);
              gap: 0.75rem;
            }
            
            .member-card {
              padding: 1rem;
            }
            
            .modal-content {
              max-width: 95vw;
              max-height: 90vh;
              margin: 0.5rem;
            }
            
            .modal-content .compact-stats {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 0.5rem !important;
              padding: 0 1.5rem !important;
            }
          }
          
          @media (max-width: 480px) {
            .header {
              padding: 0.75rem;
            }
            
            .header-title {
              font-size: 1.25rem;
              flex-direction: column;
              gap: 0.5rem;
              text-align: center;
            }
            
            .overview-cards {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }
            
            .overview-card {
              padding: 1.25rem 0.75rem;
              border-radius: 16px;
            }
            
            .team-grid {
              gap: 0.75rem;
            }
            
            .member-card {
              padding: 0.75rem;
            }
            
            .kpi-stats {
              grid-template-columns: 1fr;
              gap: 0.5rem;
            }
            
            .kpi-stat {
              padding: 0.5rem;
            }
            
            .modal-content {
              max-width: 98vw;
              max-height: 85vh;
              margin: 0.25rem;
            }
            
            .modal-content .compact-stats {
              grid-template-columns: 1fr !important;
              gap: 0.5rem !important;
              padding: 0 1rem !important;
            }
          }
          `}}),(0,i.jsxs)("div",{className:"reporting-container",children:[i.jsx(l.Z,{projects:[],onCreateProject:()=>{}}),(0,i.jsxs)("main",{className:"main-content",children:[(0,i.jsxs)("header",{className:"header",children:[i.jsx("h1",{className:"header-title",children:"Team Reporting & KPIs"}),i.jsx("p",{style:{color:"#666666",marginTop:"0.5rem",fontSize:"1.1rem",fontWeight:"400",lineHeight:"1.5"},children:"Monitor performance of team members in your accessible projects only"})]}),(0,i.jsxs)("div",{style:{padding:"2rem 3rem 3rem 3rem",maxWidth:"1400px",margin:"0 auto"},children:[f&&i.jsx("div",{style:{background:"#ffffff",border:"1px solid #F87239",color:"#F87239",padding:"1rem",borderRadius:"12px",marginBottom:"2rem",fontWeight:"500",boxShadow:"0 2px 8px rgba(248, 114, 57, 0.1)"},children:f}),c&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)("div",{className:"overview-cards",children:[(0,i.jsxs)("div",{className:"overview-card",children:[i.jsx("div",{style:{fontSize:"3rem",fontWeight:"600",color:"#5884FD",lineHeight:"1",marginBottom:"0.5rem",background:"linear-gradient(135deg, #5884FD, #7BA3FF)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"},children:c.summary.total_team_members}),i.jsx("div",{style:{color:"#666666",fontSize:"1rem",fontWeight:"500",letterSpacing:"-0.01em",lineHeight:"1.4"},children:"Your Project Team Members"})]}),(0,i.jsxs)("div",{className:"overview-card",children:[(0,i.jsxs)("div",{style:{fontSize:"3rem",fontWeight:"600",color:"#10B981",lineHeight:"1",marginBottom:"0.5rem",background:"linear-gradient(135deg, #10B981, #34D399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"},children:[c.summary.average_completion_rate,"%"]}),i.jsx("div",{style:{color:"#666666",fontSize:"1rem",fontWeight:"500",letterSpacing:"-0.01em",lineHeight:"1.4"},children:"Team Completion Rate"})]}),(0,i.jsxs)("div",{className:"overview-card",children:[i.jsx("div",{style:{fontSize:"3rem",fontWeight:"600",color:"#FFB333",lineHeight:"1",marginBottom:"0.5rem",background:"linear-gradient(135deg, #FFB333, #FCD34D)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"},children:c.summary.total_tasks_across_team}),i.jsx("div",{style:{color:"#666666",fontSize:"1rem",fontWeight:"500",letterSpacing:"-0.01em",lineHeight:"1.4"},children:"Total Tasks"})]}),(0,i.jsxs)("div",{className:"overview-card",children:[i.jsx("div",{style:{fontSize:"3rem",fontWeight:"600",color:"#C483D9",lineHeight:"1",marginBottom:"0.5rem",background:"linear-gradient(135deg, #C483D9, #DDA0DD)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"},children:c.summary.total_finished_tasks}),i.jsx("div",{style:{color:"#666666",fontSize:"1rem",fontWeight:"500",letterSpacing:"-0.01em",lineHeight:"1.4"},children:"Completed Tasks"})]}),(0,i.jsxs)("div",{className:"overview-card",style:{cursor:"pointer",border:"1px solid #F87239",background:"linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)"},onClick:()=>{let e=c.team_report.filter(e=>e.overdue_tasks>0);if(e.length>0){let r=e.map(e=>`${e.user_name}: ${e.overdue_tasks} overdue tasks`).join("\n");alert(`Team Overdue Tasks:

${r}

Click on individual team members below to see specific overdue tasks.`)}},onMouseOver:e=>{e.currentTarget.style.transform="translateY(-2px)",e.currentTarget.style.boxShadow="0 8px 32px rgba(248, 114, 57, 0.3)"},onMouseOut:e=>{e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="0 2px 16px rgba(0, 0, 0, 0.04)"},children:[i.jsx("div",{style:{fontSize:"3rem",fontWeight:"600",color:"#F87239",lineHeight:"1",marginBottom:"0.5rem",background:"linear-gradient(135deg, #F87239, #FB923C)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"},children:c.team_report.reduce((e,r)=>e+(r.overdue_tasks||0),0)}),i.jsx("div",{style:{color:"#F87239",fontSize:"1rem",fontWeight:"600",letterSpacing:"-0.01em",lineHeight:"1.4"},children:"Team Overdue Tasks (Click to view)"})]})]}),i.jsx("div",{className:"team-grid",children:c.team_report.map(e=>(0,i.jsxs)("div",{className:"member-card",onClick:()=>j(e.user_id),children:[(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"},children:[(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"1rem"},children:[i.jsx("div",{style:{width:"56px",height:"56px",borderRadius:"50%",background:"linear-gradient(135deg, #5884FD, #C483D9)",color:"#ffffff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"700",fontSize:"1.25rem",boxShadow:"0 4px 12px rgba(88, 132, 253, 0.3)"},children:e.user_name.charAt(0).toUpperCase()}),(0,i.jsxs)("div",{children:[i.jsx("h3",{style:{fontWeight:"600",color:"#1a1a1a",margin:"0 0 0.25rem 0",fontSize:"1.1rem",letterSpacing:"-0.01em"},children:e.user_name}),i.jsx("p",{style:{color:"#666666",fontSize:"0.875rem",margin:"0",fontWeight:"500"},children:e.user_position||e.user_role})]})]}),i.jsx("button",{style:{padding:"0.75rem 1rem",border:"1px solid #e8e8e8",background:"#ffffff",borderRadius:"12px",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.5rem",fontSize:"0.875rem",fontWeight:"500",color:"#5884FD",transition:"all 0.2s ease",boxShadow:"0 2px 8px rgba(0, 0, 0, 0.04)"},onClick:r=>{r.stopPropagation(),j(e.user_id)},onMouseEnter:e=>{e.currentTarget.style.background="#5884FD",e.currentTarget.style.color="#ffffff",e.currentTarget.style.borderColor="#5884FD",e.currentTarget.style.transform="translateY(-1px)",e.currentTarget.style.boxShadow="0 4px 12px rgba(88, 132, 253, 0.3)"},onMouseLeave:e=>{e.currentTarget.style.background="#ffffff",e.currentTarget.style.color="#5884FD",e.currentTarget.style.borderColor="#e8e8e8",e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"},children:"View Details"})]}),(0,i.jsxs)("div",{className:"kpi-stats",children:[(0,i.jsxs)("div",{className:"kpi-stat",children:[i.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"bold",color:"#10b981",margin:"0"},children:e.finished_tasks}),i.jsx("div",{style:{color:"#666666",fontSize:"0.75rem",margin:"0.25rem 0 0 0",textTransform:"uppercase"},children:"Finished Tasks"})]}),(0,i.jsxs)("div",{className:"kpi-stat",children:[i.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"bold",color:"#f59e0b",margin:"0"},children:e.unfinished_tasks}),i.jsx("div",{style:{color:"#666666",fontSize:"0.75rem",margin:"0.25rem 0 0 0",textTransform:"uppercase"},children:"Unfinished Tasks"})]}),(0,i.jsxs)("div",{className:"kpi-stat",style:{cursor:e.overdue_tasks>0?"pointer":"default",transition:"all 0.2s ease"},onClick:r=>{e.overdue_tasks>0&&(r.stopPropagation(),j(e.user_id))},onMouseOver:r=>{e.overdue_tasks>0&&(r.currentTarget.style.backgroundColor="#fef2f2",r.currentTarget.style.borderColor="#ef4444")},onMouseOut:e=>{e.currentTarget.style.backgroundColor="#f9fafb",e.currentTarget.style.borderColor="#e5e7eb"},children:[i.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"bold",color:"#ef4444",margin:"0"},children:e.overdue_tasks}),(0,i.jsxs)("div",{style:{color:"#666666",fontSize:"0.75rem",margin:"0.25rem 0 0 0",textTransform:"uppercase"},children:["Overdue Tasks ",e.overdue_tasks>0&&"(Click to view)"]})]}),(0,i.jsxs)("div",{className:"kpi-stat",children:[i.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"bold",color:"#3b82f6",margin:"0"},children:e.active_projects}),i.jsx("div",{style:{color:"#666666",fontSize:"0.75rem",margin:"0.25rem 0 0 0",textTransform:"uppercase"},children:"Active Projects"})]})]}),(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.5rem"},children:[i.jsx("span",{children:"Completion Rate"}),(0,i.jsxs)("span",{style:{fontWeight:"600",fontSize:"1.1rem",color:_(e.completion_rate)},children:[e.completion_rate,"%"]})]}),i.jsx("div",{className:"progress-bar",children:i.jsx("div",{style:{height:"100%",width:`${e.completion_rate}%`,backgroundColor:_(e.completion_rate),transition:"width 0.3s ease"}})})]},e.user_id))})]})]})]})]}),b&&x&&i.jsx("div",{className:"modal-overlay",onClick:()=>v(!1),children:(0,i.jsxs)("div",{className:"modal-content",onClick:e=>e.stopPropagation(),children:[i.jsx("div",{style:{background:"linear-gradient(135deg, #F5F5ED 0%, #ffffff 100%)",borderRadius:"24px 24px 0 0",padding:"2.5rem 3rem",margin:"-2px -2px 2.5rem -2px",borderBottom:"1px solid #e8e8e8"},children:(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between"},children:[(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"1.5rem"},children:[i.jsx("div",{style:{width:"72px",height:"72px",borderRadius:"50%",background:"linear-gradient(135deg, #5884FD, #C483D9)",color:"#ffffff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"700",fontSize:"1.75rem",boxShadow:"0 8px 24px rgba(88, 132, 253, 0.3)"},children:x.user_info.name.charAt(0).toUpperCase()}),(0,i.jsxs)("div",{children:[i.jsx("h2",{style:{fontSize:"2rem",fontWeight:"300",color:"#1a1a1a",margin:"0 0 0.5rem 0",letterSpacing:"-0.025em"},children:x.user_info.name}),i.jsx("p",{style:{fontSize:"1.1rem",color:"#666666",margin:"0",fontWeight:"400"},children:"Performance Report & Task Overview"})]})]}),i.jsx("button",{style:{background:"#ffffff",border:"2px solid #e8e8e8",borderRadius:"16px",padding:"1rem 1.5rem",cursor:"pointer",fontWeight:"500",color:"#666666",transition:"all 0.3s ease",boxShadow:"0 4px 16px rgba(0, 0, 0, 0.05)",fontSize:"1rem"},onClick:()=>v(!1),onMouseEnter:e=>{e.currentTarget.style.background="#F87239",e.currentTarget.style.color="#ffffff",e.currentTarget.style.borderColor="#F87239",e.currentTarget.style.transform="translateY(-2px)",e.currentTarget.style.boxShadow="0 8px 24px rgba(248, 114, 57, 0.3)"},onMouseLeave:e=>{e.currentTarget.style.background="#ffffff",e.currentTarget.style.color="#666666",e.currentTarget.style.borderColor="#e8e8e8",e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="0 4px 16px rgba(0, 0, 0, 0.05)"},children:"Close"})]})}),(0,i.jsxs)("div",{className:"compact-stats",style:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"0.75rem",marginBottom:"1.5rem",padding:"0 3rem"},children:[(0,i.jsxs)("div",{style:{background:"linear-gradient(135deg, #ffffff 0%, #fef9f0 100%)",border:"1px solid #FFB333",borderRadius:"12px",padding:"1rem",textAlign:"center",boxShadow:"0 2px 8px rgba(255, 179, 51, 0.1)",transition:"all 0.3s ease"},children:[i.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"700",color:"#FFB333",margin:"0 0 0.25rem 0",lineHeight:"1",background:"linear-gradient(135deg, #FFB333, #FCD34D)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"},children:x.task_summary?.total_tasks||0}),i.jsx("div",{style:{color:"#666666",fontSize:"0.75rem",fontWeight:"500",letterSpacing:"-0.01em"},children:"Total Tasks"})]}),(0,i.jsxs)("div",{style:{background:"linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",border:"1px solid #10B981",borderRadius:"12px",padding:"1rem",textAlign:"center",boxShadow:"0 2px 8px rgba(16, 185, 129, 0.1)",transition:"all 0.3s ease"},children:[i.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"700",color:"#10B981",margin:"0 0 0.25rem 0",lineHeight:"1",background:"linear-gradient(135deg, #10B981, #34D399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"},children:x.task_summary?.completed_tasks||0}),i.jsx("div",{style:{color:"#666666",fontSize:"0.75rem",fontWeight:"500",letterSpacing:"-0.01em"},children:"Completed"})]}),(0,i.jsxs)("div",{style:{background:"linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)",border:"1px solid #5884FD",borderRadius:"12px",padding:"1rem",textAlign:"center",boxShadow:"0 2px 8px rgba(88, 132, 253, 0.1)",transition:"all 0.3s ease"},children:[i.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"700",color:"#5884FD",margin:"0 0 0.25rem 0",lineHeight:"1",background:"linear-gradient(135deg, #5884FD, #7BA3FF)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"},children:x.task_summary?.in_progress_tasks||0}),i.jsx("div",{style:{color:"#666666",fontSize:"0.75rem",fontWeight:"500",letterSpacing:"-0.01em"},children:"In Progress"})]}),(0,i.jsxs)("div",{style:{background:"linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)",border:"1px solid #F87239",borderRadius:"12px",padding:"1rem",textAlign:"center",boxShadow:"0 2px 8px rgba(248, 114, 57, 0.1)",transition:"all 0.3s ease"},children:[i.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"700",color:"#F87239",margin:"0 0 0.25rem 0",lineHeight:"1",background:"linear-gradient(135deg, #F87239, #FB923C)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"},children:x.task_summary?.overdue_tasks||0}),i.jsx("div",{style:{color:"#666666",fontSize:"0.75rem",fontWeight:"500",letterSpacing:"-0.01em"},children:"Overdue"})]}),(0,i.jsxs)("div",{style:{background:"linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",border:"1px solid #f59e0b",borderRadius:"12px",padding:"1rem",textAlign:"center",boxShadow:"0 2px 8px rgba(245, 158, 11, 0.1)",transition:"all 0.3s ease"},children:[i.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"700",color:"#f59e0b",margin:"0 0 0.25rem 0",lineHeight:"1",background:"linear-gradient(135deg, #f59e0b, #fbbf24)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"},children:x.task_summary?.todo_tasks||0}),i.jsx("div",{style:{color:"#666666",fontSize:"0.75rem",fontWeight:"500",letterSpacing:"-0.01em"},children:"To Do"})]}),(0,i.jsxs)("div",{style:{background:"linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)",border:"1px solid #C483D9",borderRadius:"12px",padding:"1rem",textAlign:"center",boxShadow:"0 2px 8px rgba(196, 131, 217, 0.1)",transition:"all 0.3s ease"},children:[i.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"700",color:"#C483D9",margin:"0 0 0.25rem 0",lineHeight:"1",background:"linear-gradient(135deg, #C483D9, #DDA0DD)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"},children:x.project_involvement?.length||0}),i.jsx("div",{style:{color:"#666666",fontSize:"0.75rem",fontWeight:"500",letterSpacing:"-0.01em"},children:"Active Projects"})]})]}),x.overdue_task_details&&x.overdue_task_details.length>0&&i.jsx("div",{style:{marginBottom:"1.5rem",padding:"0 3rem"},children:(0,i.jsxs)("div",{style:{background:"linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)",borderRadius:"16px",padding:"2rem",border:"1px solid #F87239",boxShadow:"0 4px 16px rgba(248, 114, 57, 0.15)"},children:[(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem",paddingBottom:"1rem",borderBottom:"1px solid #fecaca"},children:[(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[i.jsx("div",{style:{width:"3px",height:"24px",backgroundColor:"#F87239",borderRadius:"2px"}}),(0,i.jsxs)("h3",{style:{margin:"0",color:"#F87239",fontSize:"1.25rem",fontWeight:"600",letterSpacing:"-0.01em"},children:["Overdue Tasks (",x.overdue_task_details.length,")"]})]}),x.overdue_task_details.length>2&&(0,i.jsxs)("button",{style:{background:"#F87239",color:"#ffffff",border:"none",padding:"0.75rem 1.25rem",borderRadius:"12px",fontSize:"0.875rem",cursor:"pointer",fontWeight:"500",transition:"all 0.3s ease",boxShadow:"0 2px 8px rgba(248, 114, 57, 0.3)"},onMouseEnter:e=>{e.currentTarget.style.background="#e66429",e.currentTarget.style.transform="translateY(-1px)",e.currentTarget.style.boxShadow="0 4px 12px rgba(248, 114, 57, 0.4)"},onMouseLeave:e=>{e.currentTarget.style.background="#F87239",e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="0 2px 8px rgba(248, 114, 57, 0.3)"},onClick:()=>{let e=x.overdue_task_details;alert(`All ${e.length} overdue tasks:

${e.map((e,r)=>`${r+1}. ${e.name} (Due: ${e.due_date})`).join("\n")}`)},children:["View All ",x.overdue_task_details.length]})]}),i.jsx("div",{style:{display:"grid",gap:"1rem",maxHeight:"300px",overflow:"auto"},children:x.overdue_task_details.slice(0,2).map((e,r)=>(0,i.jsxs)("div",{style:{background:"#ffffff",border:"1px solid #fecaca",borderRadius:"12px",padding:"1.5rem",cursor:"pointer",transition:"all 0.3s ease",boxShadow:"0 2px 8px rgba(248, 114, 57, 0.1)"},onMouseOver:e=>{e.currentTarget.style.borderColor="#F87239",e.currentTarget.style.transform="translateY(-1px)",e.currentTarget.style.boxShadow="0 4px 12px rgba(248, 114, 57, 0.2)"},onMouseOut:e=>{e.currentTarget.style.borderColor="#fecaca",e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="0 2px 8px rgba(248, 114, 57, 0.1)"},onClick:()=>{alert(`Task Details:

Name: ${e.name}
Description: ${e.description||"No description"}
Due Date: ${e.due_date}
Priority: ${e.priority||"Not set"}
Project: ${e.project_name||"Unknown"}

Days Overdue: ${e.days_overdue}`)},children:[(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.75rem"},children:[i.jsx("h4",{style:{color:"#F87239",fontSize:"1.125rem",fontWeight:"600",margin:"0",letterSpacing:"-0.01em"},children:e.name}),(0,i.jsxs)("span",{style:{background:"linear-gradient(135deg, #F87239, #FB923C)",color:"#ffffff",padding:"0.375rem 0.75rem",borderRadius:"16px",fontSize:"0.75rem",fontWeight:"600",boxShadow:"0 2px 6px rgba(248, 114, 57, 0.3)"},children:[e.days_overdue," days overdue"]})]}),(0,i.jsxs)("div",{style:{fontSize:"0.9rem",color:"#666666",marginBottom:"0.75rem",lineHeight:"1.4"},children:[i.jsx("strong",{children:"Due:"})," ",new Date(e.due_date).toLocaleDateString("en-US",{weekday:"short",year:"numeric",month:"short",day:"numeric"})]}),(0,i.jsxs)("div",{style:{display:"flex",gap:"1.5rem",fontSize:"0.85rem",color:"#666666",marginBottom:"0.75rem"},children:[(0,i.jsxs)("span",{children:[i.jsx("strong",{children:"Priority:"})," ",e.priority||"Not set"]}),(0,i.jsxs)("span",{children:[i.jsx("strong",{children:"Project:"})," ",e.project_name]})]}),i.jsx("div",{style:{fontSize:"0.75rem",color:"#999999",textAlign:"center",padding:"0.5rem",background:"#f8f9fa",borderRadius:"8px",fontStyle:"italic"},children:"Click for details"})]},r))}),x.overdue_task_details.length>2&&i.jsx("div",{style:{padding:"1rem",textAlign:"center",background:"linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)",borderRadius:"12px",marginTop:"1rem",border:"1px solid #fecaca"},children:(0,i.jsxs)("span",{style:{color:"#F87239",fontSize:"0.875rem",fontWeight:"500"},children:["Showing 2 of ",x.overdue_task_details.length," overdue tasks"]})})]})}),(!x.overdue_task_details||0===x.overdue_task_details.length)&&i.jsx("div",{style:{padding:"0 3rem 2rem 3rem"},children:(0,i.jsxs)("div",{style:{background:"linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",borderRadius:"24px",padding:"3rem",border:"2px solid #10B981",boxShadow:"0 8px 32px rgba(16, 185, 129, 0.15)",textAlign:"center"},children:[i.jsx("div",{style:{fontSize:"3rem",margin:"0 0 1rem 0"},children:"\uD83C\uDF89"}),i.jsx("h3",{style:{color:"#10B981",fontSize:"1.5rem",fontWeight:"600",margin:"0 0 1rem 0",letterSpacing:"-0.02em"},children:"No Overdue Tasks!"}),(0,i.jsxs)("p",{style:{color:"#666666",fontSize:"1.1rem",margin:"0",lineHeight:"1.5"},children:[x.user_info.name," is keeping up with all deadlines. Great work!"]})]})})]})})]}):null}},84016:(e,r,t)=>{"use strict";t.r(r),t.d(r,{$$typeof:()=>o,__esModule:()=>n,default:()=>l});var i=t(95153);let a=(0,i.createProxy)(String.raw`/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/reporting/page.tsx`),{__esModule:n,$$typeof:o}=a,s=a.default,l=s},29329:(e,r,t)=>{"use strict";t.d(r,{Z:()=>n});var i=t(34218);let a=i.forwardRef(function({title:e,titleId:r,...t},a){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:a,"aria-labelledby":r},t),e?i.createElement("title",{id:r},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"}))}),n=a},99374:(e,r,t)=>{"use strict";t.d(r,{Z:()=>n});var i=t(34218);let a=i.forwardRef(function({title:e,titleId:r,...t},a){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:a,"aria-labelledby":r},t),e?i.createElement("title",{id:r},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"}))}),n=a},62075:(e,r,t)=>{"use strict";t.d(r,{Z:()=>n});var i=t(34218);let a=i.forwardRef(function({title:e,titleId:r,...t},a){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:a,"aria-labelledby":r},t),e?i.createElement("title",{id:r},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"}))}),n=a},89618:(e,r,t)=>{"use strict";t.d(r,{Z:()=>n});var i=t(34218);let a=i.forwardRef(function({title:e,titleId:r,...t},a){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:a,"aria-labelledby":r},t),e?i.createElement("title",{id:r},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"}))}),n=a},84063:(e,r,t)=>{"use strict";t.d(r,{Z:()=>n});var i=t(34218);let a=i.forwardRef(function({title:e,titleId:r,...t},a){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:a,"aria-labelledby":r},t),e?i.createElement("title",{id:r},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"}))}),n=a},8041:(e,r,t)=>{"use strict";t.d(r,{Z:()=>n});var i=t(34218);let a=i.forwardRef(function({title:e,titleId:r,...t},a){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:a,"aria-labelledby":r},t),e?i.createElement("title",{id:r},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m19.5 8.25-7.5 7.5-7.5-7.5"}))}),n=a},92843:(e,r,t)=>{"use strict";t.d(r,{Z:()=>n});var i=t(34218);let a=i.forwardRef(function({title:e,titleId:r,...t},a){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:a,"aria-labelledby":r},t),e?i.createElement("title",{id:r},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"}),i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"}))}),n=a},27121:(e,r,t)=>{"use strict";t.d(r,{Z:()=>n});var i=t(34218);let a=i.forwardRef(function({title:e,titleId:r,...t},a){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:a,"aria-labelledby":r},t),e?i.createElement("title",{id:r},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"}))}),n=a},75908:(e,r,t)=>{"use strict";t.d(r,{Z:()=>n});var i=t(34218);let a=i.forwardRef(function({title:e,titleId:r,...t},a){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:a,"aria-labelledby":r},t),e?i.createElement("title",{id:r},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"}))}),n=a},18998:(e,r,t)=>{"use strict";t.d(r,{Z:()=>n});var i=t(34218);let a=i.forwardRef(function({title:e,titleId:r,...t},a){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:a,"aria-labelledby":r},t),e?i.createElement("title",{id:r},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 4.5v15m7.5-7.5h-15"}))}),n=a},34148:(e,r,t)=>{"use strict";t.d(r,{Z:()=>n});var i=t(34218);let a=i.forwardRef(function({title:e,titleId:r,...t},a){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:a,"aria-labelledby":r},t),e?i.createElement("title",{id:r},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"}))}),n=a},96835:(e,r,t)=>{"use strict";t.d(r,{Z:()=>n});var i=t(34218);let a=i.forwardRef(function({title:e,titleId:r,...t},a){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:a,"aria-labelledby":r},t),e?i.createElement("title",{id:r},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6 18 18 6M6 6l12 12"}))}),n=a}};var r=require("../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),i=r.X(0,[3271,2977,1323,7490,7609,7068],()=>t(65709));module.exports=i})();