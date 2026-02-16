(()=>{var e={};e.id=5796,e.ids=[5796],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},13685:e=>{"use strict";e.exports=require("http")},95687:e=>{"use strict";e.exports=require("https")},71017:e=>{"use strict";e.exports=require("path")},85477:e=>{"use strict";e.exports=require("punycode")},12781:e=>{"use strict";e.exports=require("stream")},57310:e=>{"use strict";e.exports=require("url")},59796:e=>{"use strict";e.exports=require("zlib")},60914:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>o.a,__next_app__:()=>c,originalPathname:()=>p,pages:()=>m,routeModule:()=>g,tree:()=>d});var i=r(67096),n=r(16132),a=r(37284),o=r.n(a),s=r(32564),l={};for(let e in s)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>s[e]);r.d(t,l);let d=["",{children:["timetable",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,21702)),"/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/timetable/page.tsx"]}]},{metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(r.bind(r,28835)),"/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,9291,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],m=["/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/timetable/page.tsx"],p="/timetable/page",c={require:r,loadChunk:()=>Promise.resolve()},g=new i.AppPageRouteModule({definition:{kind:n.x.APP_PAGE,page:"/timetable/page",pathname:"/timetable",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},25986:(e,t,r)=>{Promise.resolve().then(r.bind(r,83499))},83499:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>y});var i=r(53854),n=r(34218),a=r(51018),o=r(56837),s=r(44937),l=r(54791),d=r(18998),m=r(89618),p=r(32399),c=r(70856),g=r(71888),x=r(2769),f=r(96835),h=r(74448),u=r(66823),b=r(71111);function y(){let{user:e,isAuthenticated:t,isLoading:r}=(0,o.useAuth)(),y=(0,a.useRouter)(),[v,j]=(0,n.useState)([]),[w,F]=(0,n.useState)([]),[k,S]=(0,n.useState)([]),[z,_]=(0,n.useState)([]),[D,E]=(0,n.useState)(new Set),[C,N]=(0,n.useState)(!0),[B,M]=(0,n.useState)(""),[T,A]=(0,n.useState)(!1),[R,W]=(0,n.useState)(null),[I,P]=(0,n.useState)(null),[L,U]=(0,n.useState)(!1),[Y,$]=(0,n.useState)(0),[O,Z]=(0,n.useState)("calendar"),[q,H]=(0,n.useState)("month"),[K,G]=(0,n.useState)(new Date),[V,J]=(0,n.useState)(!1),[X,Q]=(0,n.useState)([]),[ee,et]=(0,n.useState)(!1);(0,n.useEffect)(()=>{let e=()=>{et(window.innerWidth<768)};return e(),window.addEventListener("resize",e),()=>window.removeEventListener("resize",e)},[]);let[er,ei]=(0,n.useState)(null),[en,ea]=(0,n.useState)({title:"",description:"",date:"",time:"",duration:60,project_id:0,attendees:"",attendee_ids:[],agenda_items:[],meeting_link:"",reminder_time:15,isRecurring:!1,endDate:"",repeatDays:[],timezone:"UK"}),[eo,es]=(0,n.useState)(""),[el,ed]=(0,n.useState)(!1),[em,ep]=(0,n.useState)(null),[ec,eg]=(0,n.useState)({date:"",time:"",duration:60,attendee_ids:[],agenda_items:[],meeting_link:"",reminder_time:15,notes:""}),[ex,ef]=(0,n.useState)(""),[eh,eu]=(0,n.useState)(!1),[eb,ey]=(0,n.useState)(0);(0,n.useEffect)(()=>{if(!r){if(!t){y.push("/login");return}ev()}},[t,r,y]),(0,n.useEffect)(()=>{en.project_id>0?(ej(en.project_id),ea(e=>({...e,attendee_ids:[]}))):_([])},[en.project_id]);let ev=async(t=!1)=>{let r=Date.now();if(!t&&eb>0&&r-eb<3e4&&w.length>0){N(!1);return}try{M("");let t=await s.projectService.getProjects();j(t||[]);let i=new Set;t.forEach(e=>{i.add(e.id)}),E(i);let n=await s.meetingService.getMeetings(),a=n.filter(t=>{let r=t.project_id||t.project;if("personal"===t.event_type||!r)return t.created_by?.id===e?.id;if(!i.has(r))return!1;if(t.created_by?.id===e?.id||t.attendee_ids&&e?.id&&t.attendee_ids.includes(e.id))return!0;let n=t.attendees_list||(t.attendees?t.attendees.split(",").map(e=>e.trim().toLowerCase()):[]),a=(e?.name||"").toLowerCase(),o=(e?.email||"").toLowerCase();return n.some(e=>e.includes(a)||e.includes(o))});F(a||[]),ey(r),s.projectService.getUsers().then(e=>S(e||[]))}catch(e){M(e instanceof Error?e.message:"Failed to load data"),console.error("Fetch error:",e)}finally{N(!1)}},ej=async e=>{try{let t=await s.projectService.getProjectMembers(e);_(t)}catch(e){console.error("Error fetching project members:",e),_([])}},ew=async e=>{if(e.preventDefault(),!en.title.trim()||!en.date||!en.time||!en.project_id){M("Please fill in all required fields");return}if(en.isRecurring){if(!en.endDate){M("Please select an end date for recurring meetings");return}if(0===en.repeatDays.length){M("Please select at least one day for recurring meetings");return}if(new Date(en.endDate)<=new Date(en.date)){M("End date must be after start date");return}}if(!D.has(en.project_id)){M("You do not have access to create meetings for this project");return}try{let e=[],t="MM"===en.timezone?eI(en.time):en.time;if(en.isRecurring&&en.endDate&&en.repeatDays.length>0){let r=new Date(en.date),i=new Date(en.endDate),n=new Date(r);for(;n<=i;){let r=n.getDay();if(en.repeatDays.includes(r)){let r=n.toISOString().split("T")[0],i={title:en.title.trim(),description:en.description.trim(),project:en.project_id,date:r,time:t,duration:en.duration,attendees:en.attendees,attendee_ids:en.attendee_ids.length>0?en.attendee_ids:void 0,agenda_items:en.agenda_items.length>0?en.agenda_items:void 0,meeting_link:en.meeting_link.trim()||void 0,reminder_time:en.reminder_time||void 0},a=await s.meetingService.createMeeting(i);e.push(a)}n.setDate(n.getDate()+1)}F([...e,...w]),alert(`Created ${e.length} recurring meetings!`)}else{let e={title:en.title.trim(),description:en.description.trim(),project:en.project_id,date:en.date,time:t,duration:en.duration,attendees:en.attendees,attendee_ids:en.attendee_ids.length>0?en.attendee_ids:void 0,agenda_items:en.agenda_items.length>0?en.agenda_items:void 0,meeting_link:en.meeting_link.trim()||void 0,reminder_time:en.reminder_time||void 0},r=await s.meetingService.createMeeting(e);F([r,...w])}ea({title:"",description:"",date:"",time:"",duration:60,project_id:0,attendees:"",attendee_ids:[],agenda_items:[],meeting_link:"",reminder_time:15,isRecurring:!1,endDate:"",repeatDays:[],timezone:"UK"}),A(!1),M("")}catch(e){M("Failed to create meeting")}},eF=e=>{P(e),U(!0);let t=e.project_id||e.project;t&&ej(t)},ek=async e=>{if(!I)return;let t=e.project||I.project_id||I.project;if(!t||!D.has(t)){M("You do not have access to update this meeting");return}try{let r=await s.meetingService.updateMeeting(I.id,{title:e.title.trim(),description:e.description?.trim()||"",date:e.date,time:e.time,duration:e.duration,project:e.project||t,attendees:e.attendees,attendee_ids:e.attendee_ids});F(w.map(e=>e.id===I.id?r:e)),P(r),M("")}catch(e){M("Failed to update meeting"),console.error("Update meeting error:",e)}},eS=async e=>{try{await eD(e),U(!1),P(null)}catch(e){}},ez=e=>{let t=e.project_id||e.project;if(!t||!D.has(t)){M("You do not have access to edit this meeting");return}W(e);let r=[];Array.isArray(e.agenda_items)&&e.agenda_items.length>0?r=e.agenda_items:"string"==typeof e.agenda&&e.agenda.trim()&&(r=e.agenda.split("\n").filter(e=>e.trim())),ea({title:e.title,description:e.description||"",date:e.date,time:e.time,duration:e.duration,project_id:e.project_id||e.project||0,attendees:e.attendees_list?e.attendees_list.join(", "):e.attendees||"",attendee_ids:e.attendee_ids||[],agenda_items:r,meeting_link:e.meeting_link||"",reminder_time:e.reminder_time||15,isRecurring:!1,endDate:"",repeatDays:[],timezone:"UK"}),es(""),A(!0)},e_=async e=>{if(e.preventDefault(),R){if(!D.has(en.project_id)){M("You do not have access to update meetings for this project");return}try{let e={title:en.title.trim(),description:en.description.trim(),project:en.project_id,date:en.date,time:en.time,duration:en.duration,attendees:en.attendees,attendee_ids:en.attendee_ids.length>0?en.attendee_ids:void 0,agenda_items:en.agenda_items.length>0?en.agenda_items:void 0,meeting_link:en.meeting_link.trim()||void 0,reminder_time:en.reminder_time||void 0},t=await s.meetingService.updateMeeting(R.id,e);F(w.map(e=>e.id===R.id?t:e)),W(null),ea({title:"",description:"",date:"",time:"",duration:60,project_id:0,attendees:"",attendee_ids:[],agenda_items:[],meeting_link:"",reminder_time:15,isRecurring:!1,endDate:"",repeatDays:[],timezone:"UK"}),A(!1),M("")}catch(e){M("Failed to update meeting")}}},eD=async e=>{try{let t=w.find(t=>t.id===e);if(!t){M("Meeting not found");return}let r=t.project_id||t.project;if(!r||!D.has(r)){M("You do not have access to delete this meeting");return}await s.meetingService.deleteMeeting(e),F(w.filter(t=>t.id!==e))}catch(e){M("Failed to delete meeting")}},eE=e=>{let t=new Date;t.setDate(t.getDate()+7);let r=t.toISOString().split("T")[0];ep(e),eg({date:r,time:e.time||"10:00",duration:e.duration||60,attendee_ids:e.attendee_ids||[],agenda_items:[`Follow-up from: ${e.title}`],meeting_link:e.meeting_link||"",reminder_time:e.reminder_time||15,notes:""}),ef("");let i=e.project_id||e.project;i&&ej(i),ed(!0)},eC=async e=>{if(e.preventDefault(),!em||!ec.date||!ec.time){M("Please fill in date and time for the follow-up meeting");return}eu(!0);try{let e=em.project_id||em.project,t=em.title.replace(/^(Follow-up:\s*)+/i,""),r={title:`Follow-up: ${t}`,description:ec.notes||`Follow-up meeting for: ${t}

Original meeting date: ${em.date}`,project:e,date:ec.date,time:ec.time,duration:ec.duration,attendees:z.filter(e=>ec.attendee_ids.includes(e.user_id)).map(e=>e.name||e.email).join(", "),attendee_ids:ec.attendee_ids.length>0?ec.attendee_ids:void 0,agenda_items:ec.agenda_items.length>0?ec.agenda_items:void 0,meeting_link:ec.meeting_link.trim()||void 0,reminder_time:ec.reminder_time||void 0},i=await s.meetingService.createMeeting(r);F([i,...w]),await eN(i,ec.attendee_ids),ed(!1),ep(null),eg({date:"",time:"",duration:60,attendee_ids:[],agenda_items:[],meeting_link:"",reminder_time:15,notes:""}),alert("✅ Follow-up meeting created and notifications sent to all attendees!")}catch(e){console.error("Error creating follow-up meeting:",e),M("Failed to create follow-up meeting")}finally{eu(!1)}},eN=async(t,r)=>{try{let i=[];for(let e of r){let t=z.find(t=>t.user_id===e);t?.email&&i.push(t.email)}if(e?.email&&i.push(e.email),0===i.length)return;let n=await fetch("/api/meeting-reminders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({meeting:{...t,project_name:em?.project_name||"Unknown Project",attendees_list:z.filter(e=>r.includes(e.user_id)).map(e=>e.name||e.email)},attendeeEmails:i,isFollowUp:!0})});n.ok||console.error("Failed to send follow-up notifications")}catch(e){console.error("Error sending follow-up notifications:",e)}},eB=()=>{ex.trim()&&(eg(e=>({...e,agenda_items:[...e.agenda_items,ex.trim()]})),ef(""))},eM=e=>{eg(t=>({...t,agenda_items:t.agenda_items.filter((t,r)=>r!==e)}))},eT=e=>{eg(t=>({...t,attendee_ids:t.attendee_ids.includes(e)?t.attendee_ids.filter(t=>t!==e):[...t.attendee_ids,e]}))},eA=e=>{let[t,r,i]=e.split("-").map(Number),n=new Date(t,r-1,i);return n.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})},eR=e=>{let[t,r]=e.split(":"),i=new Date;return i.setHours(parseInt(t),parseInt(r)),i.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0})},eW=e=>{if(!e)return"";let[t,r]=e.split(":").map(Number),i=t+5,n=r+30;return n>=60&&(n-=60,i+=1),i>=24&&(i-=24),`${String(i).padStart(2,"0")}:${String(n).padStart(2,"0")}`},eI=e=>{if(!e)return"";let[t,r]=e.split(":").map(Number),i=t-5,n=r-30;return n<0&&(n+=60,i-=1),i<0&&(i+=24),`${String(i).padStart(2,"0")}:${String(n).padStart(2,"0")}`},eP=e=>{let t=Math.floor(e/60),r=e%60;return t>0?r>0?`${t}h ${r}m`:`${t}h`:`${r}m`},eL=w.filter(e=>{let[t,r,i]=e.date.split("-").map(Number),[n,a]=e.time.split(":").map(Number),o=new Date(t,r-1,i,n,a);return o>=new Date}).sort((e,t)=>{let[r,i,n]=e.date.split("-").map(Number),[a,o]=e.time.split(":").map(Number),s=new Date(r,i-1,n,a,o),[l,d,m]=t.date.split("-").map(Number),[p,c]=t.time.split(":").map(Number),g=new Date(l,d-1,m,p,c);return s.getTime()-g.getTime()}),eU=w.filter(e=>{let[t,r,i]=e.date.split("-").map(Number),[n,a]=e.time.split(":").map(Number),o=new Date(t,r-1,i,n,a);return o<new Date}).sort((e,t)=>{let[r,i,n]=e.date.split("-").map(Number),[a,o]=e.time.split(":").map(Number),s=new Date(r,i-1,n,a,o),[l,d,m]=t.date.split("-").map(Number),[p,c]=t.time.split(":").map(Number),g=new Date(l,d-1,m,p,c);return g.getTime()-s.getTime()}),eY=e=>new Date(e.getFullYear(),e.getMonth()+1,0).getDate(),e$=e=>new Date(e.getFullYear(),e.getMonth(),1).getDay(),eO=(0,n.useMemo)(()=>{let e={};return w.forEach(t=>{e[t.date]||(e[t.date]=[]),e[t.date].push(t)}),e},[w]),eZ=e=>{let t=e.getFullYear(),r=String(e.getMonth()+1).padStart(2,"0"),i=String(e.getDate()).padStart(2,"0"),n=`${t}-${r}-${i}`,a=eO[n]||[];return a.sort((e,t)=>{let[r,i]=e.time.split(":").map(Number),[n,a]=t.time.split(":").map(Number);return 60*r+i-(60*n+a)})},eq=e=>{let t=new Date(e),r=t.getDay();t.setDate(t.getDate()-r);let i=[];for(let e=0;e<7;e++){let r=new Date(t);r.setDate(t.getDate()+e),i.push(r)}return i},eH=e=>e.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}),eK=()=>{if("month"===q)G(new Date(K.getFullYear(),K.getMonth()-1));else if("week"===q){let e=new Date(K);e.setDate(e.getDate()-7),G(e)}else if("day"===q){let e=new Date(K);e.setDate(e.getDate()-1),G(e)}},eG=()=>{if("month"===q)G(new Date(K.getFullYear(),K.getMonth()+1));else if("week"===q){let e=new Date(K);e.setDate(e.getDate()+7),G(e)}else if("day"===q){let e=new Date(K);e.setDate(e.getDate()+1),G(e)}},eV=new Date,eJ=(0,n.useMemo)(()=>eY(K),[K]),eX=(0,n.useMemo)(()=>e$(K),[K]),eQ=e=>e.attendees_list&&e.attendees_list.length>0?e.attendees_list:e.attendees&&"string"==typeof e.attendees?e.attendees.split(",").map(e=>e.trim()).filter(e=>e):[],e0=(e,t)=>{ei(e),Q(t),J(!0)};return r?i.jsx("div",{style:{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F5F5ED"},children:i.jsx("div",{style:{width:"32px",height:"32px",border:"3px solid #C483D9",borderTop:"3px solid #5884FD",borderRadius:"50%",animation:"spin 1s linear infinite"}})}):t?C?(0,i.jsxs)("div",{style:{minHeight:"100vh",background:"#F5F5ED"},children:[(0,i.jsxs)("div",{style:{display:"flex"},children:[i.jsx(u.Z,{projects:[],onCreateProject:()=>{}}),(0,i.jsxs)("div",{className:"page-main",style:{flex:1,marginLeft:ee?0:"280px",padding:"2rem"},children:[(0,i.jsxs)("div",{style:{marginBottom:"2rem"},children:[i.jsx("div",{style:{height:"32px",width:"250px",background:"#E5E7EB",borderRadius:"8px",marginBottom:"12px",animation:"pulse 1.5s infinite"}}),i.jsx("div",{style:{height:"20px",width:"350px",background:"#E5E7EB",borderRadius:"6px",animation:"pulse 1.5s infinite"}})]}),(0,i.jsxs)("div",{style:{background:"white",borderRadius:"16px",padding:"24px",boxShadow:"0 1px 3px rgba(0,0,0,0.1)"},children:[i.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",gap:"8px",marginBottom:"16px"},children:[1,2,3,4,5,6,7].map(e=>i.jsx("div",{style:{height:"40px",background:"#F3F4F6",borderRadius:"8px",animation:"pulse 1.5s infinite"}},e))}),i.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",gap:"8px"},children:Array.from({length:35},(e,t)=>i.jsx("div",{style:{height:"100px",background:"#F9FAFB",borderRadius:"8px",animation:"pulse 1.5s infinite"}},t))})]})]})]}),i.jsx("style",{children:"@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }"})]}):(0,i.jsxs)("div",{children:[i.jsx("style",{dangerouslySetInnerHTML:{__html:`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #F5F5ED;
          }
          .timetable-container {
            min-height: 100vh;
            display: flex;
            background: #f8fafc;
            max-width: 100vw;
            overflow-x: hidden;
            box-sizing: border-box;
          }
          .main-content {
            flex: 1;
            margin-left: ${ee?"0":"280px"};
            background: transparent;
            max-width: ${ee?"100vw":"calc(100vw - 280px)"};
            overflow-x: hidden;
            box-sizing: border-box;
            position: relative;
            z-index: 1;
            padding-top: ${ee?"70px":"0"};
            padding-left: ${ee?"12px":"0"};
            padding-right: ${ee?"12px":"0"};
          }
          .header {
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(30px);
            border-bottom: none;
            padding: 2.5rem 2rem 1.5rem 2rem;
            position: sticky;
            top: 0;
            z-index: 20;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
            box-sizing: border-box;
            width: 100%;
            overflow-x: hidden;
          }
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
            box-sizing: border-box;
            width: 100%;
            max-width: 100%;
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
            border: 2px solid rgba(196, 131, 217, 0.3);
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
            background: linear-gradient(90deg, transparent, rgba(196, 131, 217, 0.1), transparent);
            transition: left 0.6s ease;
          }
          
          .filter-btn:hover {
            background: rgba(196, 131, 217, 0.1);
            border-color: #C483D9;
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 8px 25px rgba(196, 131, 217, 0.25);
          }
          
          .filter-btn:hover::before {
            left: 100%;
          }
          
          .filter-btn.active {
            background: linear-gradient(135deg, #C483D9, #E5A3F0);
            color: #FFFFFF;
            border-color: #C483D9;
            box-shadow: 0 8px 25px rgba(196, 131, 217, 0.35);
          }
          .create-button {
            background: linear-gradient(135deg, #5884FD, #7BA3FF);
            color: #ffffff;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 16px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            transition: all 0.3s ease;
            font-family: 'Mabry Pro', 'Inter', sans-serif;
            font-size: 0.875rem;
            box-shadow: 0 4px 16px rgba(88, 132, 253, 0.3);
          }
          .create-button:hover {
            background: linear-gradient(135deg, #4A6CF7, #5884FD);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(88, 132, 253, 0.4);
          }
          .filter-section {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          .filter-select {
            padding: 0 0.5rem;
            border: 2px solid #000000;
            border-radius: 4px;
            background: #ffffff;
            color: #000000;
            font-weight: 500;
            height: 40px;
            box-sizing: border-box;
            line-height: 36px;
          }
          .main-content-area {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
            box-sizing: border-box;
            min-height: calc(100vh - 200px);
            line-height: 1.6;
          }
          .error-message {
            background: #ffffff;
            border: 1px solid #F87239;
            color: #F87239;
            padding: 1rem;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(248, 114, 57, 0.1);
          }
          
          .timetable-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            padding-top: 1.5rem;
            max-width: 1000px;
            margin: 0 auto;
          }
          
          .timetable-stats .stat-item {
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
          
          .timetable-stats .stat-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-color: #5884FD;
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
          
          .stat-value.upcoming {
            color: #5884FD;
          }
          
          .stat-value.total {
            color: #FFB333;
          }
          .meetings-section {
            margin-bottom: 2rem;
          }
          .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #000000;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .meetings-grid {
            display: grid;
            gap: 1rem;
          }
          /* Desktop Styles */
          @media (min-width: 1025px) {
            .header {
              padding: 2rem 2.5rem;
              background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
              border-bottom: 3px solid #000000;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            
            .header-content {
              max-width: 1400px;
              margin: 0 auto;
              align-items: flex-start;
              gap: 1.5rem;
            }
            
            .header-title {
              font-size: 2rem;
              gap: 1rem;
              margin-bottom: 0.5rem;
            }
            
            .header-title + p {
              font-size: 1rem;
              color: #666666;
              margin: 0;
              font-weight: 500;
            }
            
            .header-actions {
              display: flex;
              gap: 1.5rem;
              align-items: center;
              max-width: none;
              width: auto;
              margin-left: auto;
            }
            
            .filter-section {
              display: flex;
              align-items: center;
              min-width: 200px;
            }
            
            .filter-select {
              padding: 0 1rem;
              font-size: 0.9rem;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              background: #ffffff;
              transition: all 0.2s ease;
              min-width: 180px;
              height: 48px;
              box-sizing: border-box;
              font-weight: 600;
              line-height: 1;
            }
            
            .filter-select:hover {
              border-color: #6b7280;
            }
            
            .filter-select:focus {
              outline: none;
              border-color: #000000;
              box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
            }
            
            .action-buttons-row {
              display: flex;
              gap: 1rem;
              align-items: center;
            }
            
            .view-toggle {
              display: flex;
              background: #f8f9fa;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
              transition: all 0.2s ease;
              height: 48px;
              box-sizing: border-box;
            }
            
            .view-toggle:hover {
              border-color: #6b7280;
            }
            
            .view-toggle button {
              padding: 0 1.25rem;
              border: none;
              background: transparent;
              font-size: 0.9rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              color: #6b7280;
              height: 44px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
            }
            
            .view-toggle button:hover {
              background: rgba(0, 0, 0, 0.05);
            }
            
            .view-toggle button.active {
              background: #000000;
              color: #ffffff;
            }
            
            .create-button {
              padding: 0 1.75rem;
              font-size: 0.9rem;
              border-radius: 8px;
              background: linear-gradient(135deg, #000000 0%, #333333 100%);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              transition: all 0.2s ease;
              gap: 0.75rem;
              height: 48px;
              font-weight: 600;
            }
            
            .create-button:hover {
              background: linear-gradient(135deg, #333333 0%, #000000 100%);
              transform: translateY(-1px);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            }
            
            .main-content-area {
              padding: 2.5rem 2.5rem;
              max-width: 1400px;
              margin: 0 auto;
            }
            
            /* Desktop Calendar Navigation */
            .calendar-navigation {
              flex-direction: column !important;
              gap: 1.5rem !important;
              padding: 2rem !important;
              background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            
            .calendar-nav-row-1 {
              width: 100% !important;
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
            }
            
            .calendar-nav-row-2 {
              display: flex !important;
              justify-content: center !important;
            }
            
            .calendar-navigation h2 {
              font-size: 1.75rem !important;
              font-weight: 700 !important;
              color: #000000 !important;
            }
            
            .nav-button {
              padding: 0.875rem 1.5rem !important;
              font-size: 1rem !important;
              border: 2px solid #e5e7eb !important;
              background: #ffffff !important;
              border-radius: 8px !important;
              transition: all 0.2s ease !important;
              font-weight: 600 !important;
            }
            
            .nav-button:hover {
              border-color: #000000 !important;
              background: #f8f9fa !important;
              transform: translateY(-1px) !important;
            }
            
            .calendar-mode-buttons {
              border: 2px solid #e5e7eb !important;
              border-radius: 8px !important;
              background: #ffffff !important;
              overflow: hidden !important;
            }
            
            .calendar-mode-buttons button {
              padding: 0.75rem 1.5rem !important;
              font-size: 0.95rem !important;
              font-weight: 600 !important;
              transition: all 0.2s ease !important;
            }
          }
          
          /* Mobile Responsive Styles */
          @media (max-width: 1024px) {
            .main-content {
              margin-left: 0;
              max-width: 100vw;
              width: 100%;
              overflow-x: hidden;
            }
            
            .header-controls {
              flex-direction: column;
              gap: 1rem;
              align-items: stretch;
            }
            
            .filter-controls {
              justify-content: center;
            }
            
            .timetable-stats {
              grid-template-columns: repeat(2, 1fr);
              gap: 0.75rem;
            }
          }
          
          /* Tablet Portrait - Better layout */
          @media (max-width: 1024px) and (min-width: 769px) {
            .header-content {
              flex-direction: column;
              gap: 1.5rem;
            }
            
            .header-controls {
              flex-direction: row;
              justify-content: center;
              gap: 2rem;
            }
            
            .filter-controls {
              gap: 0.5rem;
            }
            
            .timetable-stats {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          @media (max-width: 768px) {
            * {
              box-sizing: border-box;
            }
            
            body, html {
              width: 100%;
              max-width: 100vw;
              overflow-x: hidden;
            }
            
            .main-content {
              margin-left: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
              overflow-x: hidden;
            }
            
            .header {
              padding: 1rem;
              position: relative;
              width: 100vw !important;
              max-width: 100vw !important;
              box-sizing: border-box;
              margin: 0;
              overflow-x: hidden;
            }
            
            .header-content {
              flex-direction: column;
              gap: 1rem;
              align-items: stretch;
              width: 100%;
              max-width: 100%;
            }
            
            .header-title {
              font-size: 1.75rem;
              text-align: center;
            }
            
            .header-title + p {
              font-size: 0.9rem;
              text-align: center;
            }
            
            .header-controls {
              flex-direction: column;
              gap: 1rem;
              align-items: stretch;
              width: 100%;
            }
            
            .filter-controls {
              display: flex;
              gap: 0.5rem;
              justify-content: center;
              flex-wrap: wrap;
            }
            
            .filter-btn {
              flex: 1;
              padding: 0.5rem 1rem;
              font-size: 0.8rem;
              min-width: 120px;
            }
            
            .create-button {
              justify-content: center;
              padding: 0.75rem 1rem;
              font-size: 0.8rem;
              align-self: center;
              min-width: 200px;
              width: 100%;
              max-width: 300px;
            }
            
            .timetable-stats {
              grid-template-columns: repeat(2, 1fr);
              gap: 0.75rem;
              padding-top: 1rem;
              width: 100%;
              box-sizing: border-box;
            }
            
            .timetable-stats .stat-item {
              padding: 1rem 0.75rem;
              min-height: 80px;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            
            .stat-value {
              font-size: 1.5rem;
            }
            
            .stat-label {
              font-size: 0.7rem;
              text-align: center;
            }
            
            .main-content-area {
              padding: 1rem;
              max-width: 100vw !important;
              min-height: calc(100vh - 150px);
              width: 100vw !important;
              box-sizing: border-box;
              margin: 0;
              overflow-x: hidden;
            }
            
            /* Calendar Navigation Mobile - 2 Row Layout */
            .calendar-navigation {
              display: flex !important;
              flex-direction: column !important;
              gap: 0.75rem !important;
              padding: 0.75rem !important;
              margin-bottom: 1rem !important;
              align-items: center !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            
            .calendar-nav-row-1 {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              width: 100% !important;
            }
            
            .calendar-navigation h2 {
              font-size: 1rem !important;
              text-align: center !important;
              margin: 0 !important;
              flex: 1 !important;
            }
            
            .calendar-nav-row-2 {
              display: flex !important;
              justify-content: center !important;
              width: 100% !important;
            }
            
            .calendar-mode-buttons {
              width: 200px !important;
              height: 32px !important;
            }
            
            .calendar-mode-buttons button {
              padding: 0.4rem 0.75rem !important;
              font-size: 0.75rem !important;
            }
            
            .nav-button {
              padding: 0.6rem 1rem !important;
              font-size: 0.8rem !important;
              min-width: 80px !important;
            }
            
            /* ULTRA-AGGRESSIVE CALENDAR GRID FIXES */
            .calendar-header-grid,
            .calendar-body-grid,
            .calendar-view div[style*="grid-template-columns"],
            .calendar-view > div:first-child,
            .calendar-view > div:last-child,
            .calendar-view > div > div {
              display: grid !important;
              grid-template-columns: repeat(7, 1fr) !important;
              width: calc(100vw - 2rem) !important;
              min-width: calc(100vw - 2rem) !important;
              gap: 1px !important;
              max-width: calc(100vw - 2rem) !important;
              overflow-x: hidden !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* FORCE ALL CALENDAR ELEMENTS */
            .calendar-view,
            .calendar-view * {
              box-sizing: border-box !important;
              max-width: calc(100vw - 2rem) !important;
            }
            
            .calendar-view > div {
              width: calc(100vw - 2rem) !important;
              max-width: calc(100vw - 2rem) !important;
              margin: 0 !important;
            }
            
            /* OVERRIDE ANY CONFLICTING GRID STYLES */
            .calendar-view div {
              grid-column: unset !important;
              grid-row: unset !important;
            }
            
            /* Calendar Day Cells Mobile */
            .calendar-day,
            [class*="calendar-day"],
            .calendar-view div[style*="border-right"] {
              min-height: 100px !important;
              padding: 8px !important;
              font-size: 12px !important;
              overflow: hidden !important;
              border: 1px solid #E5E7EB !important;
              background: white !important;
              box-sizing: border-box !important;
            }

            /* Week and Day View Mobile Adjustments */
            .calendar-view div[style*="gridTemplateColumns"] {
              grid-template-columns: repeat(7, 1fr) !important;
              gap: 1px !important;
            }

            .calendar-view div[style*="minHeight: 500px"] {
              min-height: 300px !important;
            }

            .calendar-view div[style*="minHeight: 700px"] {
              min-height: 400px !important;
            }
            
            /* FORCE CALENDAR STRUCTURE */
            .calendar-view {
              width: calc(100vw - 2rem) !important;
              max-width: calc(100vw - 2rem) !important;
              overflow-x: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* Calendar Headers Mobile */
            .calendar-header,
            [class*="calendar-header"] {
              padding: 8px 4px !important;
              font-size: 12px !important;
              font-weight: 600 !important;
            }
            
            /* Calendar Legend Mobile */
            .calendar-view > div:last-child {
              padding: 0.75rem !important;
              margin-top: 1rem !important;
            }
            
            .calendar-view > div:last-child > div:first-child {
              gap: 1rem !important;
              flex-wrap: nowrap !important;
              justify-content: center !important;
            }
            
            .calendar-day-header {
              padding: 0.4rem 0.125rem !important;
              font-size: 0.65rem !important;
              text-align: center !important;
            }
            
            .calendar-day-cell {
              min-height: 70px !important;
              max-height: 70px !important;
              padding: 0.25rem 0.125rem !important;
              overflow: hidden !important;
              display: flex !important;
              flex-direction: column !important;
            }
            
            .calendar-day-number {
              font-size: 0.8rem !important;
              margin-bottom: 0.25rem !important;
              flex-shrink: 0 !important;
            }
            
            .calendar-meeting-item {
              font-size: 0.5rem !important;
              padding: 0.125rem 0.25rem !important;
              margin-bottom: 0.125rem !important;
              line-height: 1.2 !important;
              border-radius: 2px !important;
            }
            
            .calendar-meeting-time {
              display: none !important;
            }
            
            .calendar-more-meetings {
              font-size: 0.45rem !important;
              padding: 0.1rem !important;
              margin-top: auto !important;
            }
            
            /* Meeting Cards Mobile */
            .meetings-grid {
              gap: 1rem;
            }
            
            .meeting-card {
              padding: 1rem;
              position: relative;
            }
            
            .meeting-header {
              flex-direction: column;
              gap: 0.75rem;
              align-items: flex-start;
              position: relative;
              padding-right: 4rem;
            }
            
            .meeting-actions {
              position: absolute;
              top: 0;
              right: 0;
              display: flex;
              gap: 0.375rem;
              z-index: 10;
            }
            
            .meeting-actions .action-btn {
              width: 32px;
              height: 32px;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 6px;
              font-size: 0.75rem;
            }
            
            .meeting-details {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }
            
            .detail-item {
              font-size: 0.875rem;
            }
            
            .attendees-list {
              gap: 0.375rem;
            }
            
            .attendee-tag {
              font-size: 0.7rem;
              padding: 0.25rem 0.375rem;
            }
            
            /* Modal Mobile */
            .modal-overlay {
              padding: 0.5rem;
            }
            
            .modal-content {
              max-width: calc(100vw - 1rem);
              max-height: calc(100vh - 1rem);
              margin: 0;
            }
            
            .modal-header {
              padding: 1rem;
            }
            
            .modal-title {
              font-size: 1.1rem;
            }
            
            .modal-form {
              padding: 1rem;
            }
            
            .form-group {
              margin-bottom: 1rem;
            }
            
            .form-grid, .form-grid-3 {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            
            .form-actions {
              flex-direction: column;
              gap: 0.75rem;
            }
          }
          
          @media (max-width: 480px) {
            .header {
              padding: 0.75rem;
            }
            
            .header-title {
              font-size: 1.25rem;
              text-align: center;
            }
            
            .header-title p {
              font-size: 0.8rem;
              line-height: 1.3;
            }
            
            .main-content-area {
              padding: 0.75rem;
              min-height: calc(100vh - 120px);
            }
            
            .timetable-stats {
              grid-template-columns: 1fr;
              gap: 0.5rem;
            }
            
            .stat-item {
              padding: 0.75rem;
              min-height: 60px;
            }
            
            .stat-value {
              font-size: 1.25rem;
            }
            
            .stat-label {
              font-size: 0.65rem;
            }
            
            .filter-btn {
              padding: 0.5rem 0.75rem;
              font-size: 0.75rem;
              min-width: 100px;
            }
            
            .create-button {
              padding: 0.75rem;
              font-size: 0.8rem;
              width: 100%;
              max-width: none;
            }
            
            .meeting-card {
              padding: 0.75rem;
            }
            
            .meeting-title {
              font-size: 1rem;
            }
            
            .meeting-project {
              font-size: 0.8rem;
            }
            
            .header-actions {
              gap: 0.5rem;
            }
            
            .filter-section {
              gap: 0.375rem;
            }
            
            .filter-section label {
              font-size: 0.7rem;
            }
            
            .filter-select {
              padding: 0 0.45rem;
              font-size: 0.75rem;
              height: 32px;
              box-sizing: border-box;
              line-height: 28px;
            }
            
            .action-buttons-row {
              gap: 0.375rem;
              grid-template-columns: 1fr 1fr;
              align-items: center;
            }
            
            .view-toggle {
              height: 32px !important;
              box-sizing: border-box;
              align-self: center;
            }
            
            .view-toggle button {
              font-size: 0.7rem !important;
              padding: 0.35rem 0.4rem !important;
              height: 32px;
              box-sizing: border-box;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            
            .create-button {
              padding: 0.35rem 0.4rem;
              font-size: 0.7rem;
              height: 32px;
              gap: 0.2rem;
              box-sizing: border-box;
            }
            
            .section-title {
              font-size: 1rem;
              gap: 0.25rem;
            }
            
            .meeting-card {
              padding: 0.75rem;
              position: relative;
            }
            
            .meeting-header {
              padding-right: 3.5rem;
            }
            
            .meeting-actions .action-btn {
              width: 28px;
              height: 28px;
              font-size: 0.7rem;
            }
            
            .meeting-title {
              font-size: 0.9rem;
            }
            
            .meeting-project {
              font-size: 0.75rem;
            }
            
            /* Ultra-compact Calendar for Small Screens */
            .calendar-navigation {
              padding: 0.5rem !important;
              margin-bottom: 0.75rem !important;
            }
            
            .calendar-nav-row-1 {
              margin-bottom: 0.25rem !important;
            }
            
            .calendar-navigation h2 {
              font-size: 0.9rem !important;
            }
            
            .calendar-mode-buttons {
              width: 160px !important;
              height: 28px !important;
            }
            
            .calendar-mode-buttons button {
              padding: 0.3rem 0.5rem !important;
              font-size: 0.7rem !important;
            }
            
            .nav-button {
              padding: 0.5rem 0.75rem !important;
              font-size: 0.75rem !important;
              min-width: 60px !important;
            }
            
            .calendar-day-cell {
              min-height: 60px !important;
              max-height: 60px !important;
              padding: 0.125rem !important;
            }
            
            .calendar-day-header {
              padding: 0.3rem 0.1rem !important;
              font-size: 0.6rem !important;
            }
            
            .calendar-day-number {
              font-size: 0.75rem !important;
              margin-bottom: 0.2rem !important;
            }
            
            .calendar-meeting-item {
              font-size: 0.45rem !important;
              padding: 0.1rem 0.15rem !important;
              margin-bottom: 0.1rem !important;
              line-height: 1.1 !important;
            }
            
            .calendar-more-meetings {
              font-size: 0.4rem !important;
              padding: 0.05rem !important;
            }
            
            /* Calendar Legend Mobile */
            .calendar-view > div:last-child {
              padding: 0.6rem !important;
              margin-top: 0.75rem !important;
            }
            
            .calendar-view > div:last-child > div:first-child {
              gap: 0.75rem !important;
              flex-wrap: nowrap !important;
              justify-content: center !important;
            }
            
            /* Modal Ultra-Mobile */
            .modal-overlay {
              padding: 0.25rem;
            }
            
            .modal-content {
              max-width: calc(100vw - 0.5rem);
              max-height: calc(100vh - 0.5rem);
              border-radius: 6px;
            }
            
            .modal-header {
              padding: 0.75rem;
            }
            
            .modal-title {
              font-size: 0.9rem;
            }
            
            .modal-form {
              padding: 0.75rem;
            }
            
            .form-input, .form-textarea, .form-select {
              padding: 0.75rem;
              font-size: 0.9rem;
            }
            
            .form-actions button {
              padding: 0.875rem;
              font-size: 0.9rem;
            }
          }
          
          @media (max-width: 380px) {
            .header {
              padding: 0.4rem;
            }
            
            .header-title {
              font-size: 0.9rem;
            }
            
            .header-title p {
              font-size: 0.65rem;
            }
            
            .main-content-area {
              padding: 0.6rem;
              min-height: calc(100vh - 100px);
            }
            
            .header-actions {
              gap: 0.4rem;
            }
            
            .action-buttons-row {
              gap: 0.3rem;
              grid-template-columns: 1fr 1fr;
              align-items: center;
            }
            
            .filter-section {
              gap: 0.3rem;
            }
            
            .filter-section label {
              font-size: 0.65rem;
            }
            
            .filter-select {
              padding: 0 0.4rem;
              font-size: 0.7rem;
              height: 28px;
              box-sizing: border-box;
              line-height: 24px;
            }
            
            .view-toggle {
              height: 28px !important;
              box-sizing: border-box;
              align-self: center;
            }
            
            .view-toggle button {
              font-size: 0.65rem !important;
              padding: 0.3rem 0.3rem !important;
              height: 28px;
              box-sizing: border-box;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            
            .create-button {
              padding: 0.3rem 0.3rem;
              font-size: 0.65rem;
              height: 28px;
              gap: 0.15rem;
              box-sizing: border-box;
            }
            
            .calendar-navigation {
              padding: 0.4rem !important;
            }
            
            .calendar-nav-row-1 {
              margin-bottom: 0.25rem !important;
            }
            
            .calendar-navigation h2 {
              font-size: 0.85rem !important;
            }
            
            .calendar-mode-buttons {
              width: 140px !important;
              height: 26px !important;
            }
            
            .nav-button {
              min-width: 50px !important;
              font-size: 0.7rem !important;
              padding: 0.4rem 0.6rem !important;
            }
            
            .calendar-day-cell {
              min-height: 50px !important;
              max-height: 50px !important;
              padding: 0.1rem !important;
            }
            
            .calendar-day-header {
              padding: 0.25rem 0.05rem !important;
              font-size: 0.55rem !important;
            }
            
            .calendar-day-number {
              font-size: 0.7rem !important;
              margin-bottom: 0.15rem !important;
            }
            
            .calendar-meeting-item {
              font-size: 0.4rem !important;
              padding: 0.05rem 0.1rem !important;
              margin-bottom: 0.05rem !important;
            }
            
                                     .calendar-more-meetings {
              font-size: 0.35rem !important;
            }
            
            /* Calendar Legend Ultra Mobile */
            .calendar-view > div:last-child {
              padding: 0.5rem !important;
              margin-top: 0.5rem !important;
            }
            
            .calendar-view > div:last-child > div:first-child {
              gap: 0.5rem !important;
              flex-wrap: nowrap !important;
              justify-content: center !important;
            }
            
            /* Ultra Small Meeting Cards */
            .meeting-card {
              padding: 0.5rem;
            }
            
            .meeting-header {
              padding-right: 3rem;
            }
            
            .meeting-actions .action-btn {
              width: 24px;
              height: 24px;
              font-size: 0.65rem;
            }
            
            .meeting-title {
              font-size: 0.85rem;
            }
            
            .meeting-project {
              font-size: 0.7rem;
            }
           }
           
           /* Landscape mobile optimization */
           @media (max-width: 768px) and (orientation: landscape) {
             .calendar-day-cell {
               min-height: 50px !important;
               max-height: 50px !important;
             }
             
             .calendar-day-number {
               font-size: 0.7rem !important;
               margin-bottom: 0.15rem !important;
             }
             
             .calendar-meeting-item {
               font-size: 0.4rem !important;
               padding: 0.08rem 0.15rem !important;
               margin-bottom: 0.08rem !important;
             }
           }
          
          .meeting-card {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 4px;
            padding: 1.5rem;
            transition: all 0.2s ease;
            position: relative;
          }
          .meeting-card:hover {
            transform: translateY(-2px);
            box-shadow: 4px 4px 0px #000000;
          }
          .meeting-header {
            display: flex;
            align-items: start;
            justify-content: space-between;
            margin-bottom: 1rem;
          }
          
          /* Desktop Meeting Actions */
          @media (min-width: 1025px) {
            .meeting-actions {
              position: static;
              flex-direction: row;
              gap: 0.5rem;
            }
            
            .meeting-actions .action-btn {
              width: auto;
              height: auto;
              padding: 0.25rem;
            }
          }
          .meeting-title {
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
          }
          .meeting-project {
            font-size: 0.875rem;
            color: #666666;
            font-weight: 500;
          }
          .meeting-actions {
            display: flex;
            gap: 0.5rem;
          }
          .action-btn {
            padding: 0.25rem;
            border: 1px solid #000000;
            background: #ffffff;
            color: #000000;
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .action-btn:hover {
            background: #f0f0f0;
          }
          .action-btn.delete:hover {
            background: #fef2f2;
            border-color: #ef4444;
            color: #ef4444;
          }
          .meeting-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .detail-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: #666666;
          }
          .meeting-description {
            color: #000000;
            line-height: 1.5;
            margin-bottom: 1rem;
          }
          .attendees-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .attendee-tag {
            background: #f0f0f0;
            border: 1px solid #000000;
            padding: 0.25rem 0.5rem;
            border-radius: 2px;
            font-size: 0.75rem;
            color: #000000;
          }
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 50;
            animation: fadeIn 0.2s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .modal-content {
            background: #ffffff;
            border: 2px solid #000000;
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            border-radius: 8px;
            animation: slideIn 0.3s ease-out;
            overflow: hidden;
          }
          @keyframes slideIn {
            from { transform: translateY(-20px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem 1.5rem 1rem 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            flex-shrink: 0;
            background: #ffffff;
          }
          .modal-title {
            font-size: 1.25rem;
            font-weight: bold;
            color: #000000;
            margin: 0;
          }
          .modal-close-btn {
            width: 32px;
            height: 32px;
            border: none;
            background: #f3f4f6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            font-weight: bold;
            color: #6b7280;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .modal-close-btn:hover {
            background: #e5e7eb;
            color: #374151;
          }
          .modal-form {
            padding: 1.5rem;
            overflow-y: auto;
            flex: 1;
            min-height: 0;
          }
          .form-group {
            margin-bottom: 1.5rem;
          }
          .form-label {
            display: block;
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
          }
          .form-input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #000000;
            border-radius: 4px;
            font-size: 1rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
          }
          .form-input:focus {
            outline: none;
            border-color: #000000;
            background: #f9f9f9;
          }
          .form-textarea {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #000000;
            border-radius: 4px;
            font-size: 1rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
            resize: vertical;
            min-height: 100px;
            font-family: inherit;
          }
          .form-select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #000000;
            border-radius: 4px;
            font-size: 1rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
          }
          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          .form-grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 140px;
            gap: 1rem;
          }
          .form-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
          }
          .btn-primary {
            flex: 1;
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .btn-primary:hover {
            background: #333333;
            transform: translateY(-1px);
          }
          .btn-secondary {
            flex: 1;
            background: #ffffff;
            color: #000000;
            border: 2px solid #000000;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .btn-secondary:hover {
            background: #f0f0f0;
            transform: translateY(-1px);
          }
          .empty-state {
            text-align: center;
            padding: 3rem 0;
            color: #666666;
          }
          .empty-icon {
            width: 64px;
            height: 64px;
            background: #f0f0f0;
            border: 2px solid #000000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
          }
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
            }
            .header-content {
              flex-direction: column;
              gap: 1rem;
              align-items: start;
            }
            
            /* FORCE CALENDAR TABLE LAYOUT */
            .calendar-view table {
              width: 100% !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
            }
            
            .calendar-view th,
            .calendar-view td {
              width: 14.285% !important;
              min-width: 40px !important;
              box-sizing: border-box !important;
              padding: 4px !important;
              font-size: 10px !important;
            }
            .form-grid {
              grid-template-columns: 1fr;
            }
            .form-grid-3 {
              grid-template-columns: 1fr;
            }
          }
        `}}),(0,i.jsxs)("div",{className:"timetable-container",children:[i.jsx(u.Z,{projects:v,onCreateProject:()=>{console.log("Create project clicked")}}),(0,i.jsxs)("main",{className:"main-content",children:[(0,i.jsxs)("header",{className:"header",children:[(0,i.jsxs)("div",{className:"header-content",children:[(0,i.jsxs)("div",{children:[(0,i.jsxs)("h1",{className:"header-title",children:[i.jsx(l.Z,{style:{width:"32px",height:"32px"}}),"Meeting Schedule"]}),i.jsx("p",{style:{color:"#666666",fontSize:"1.1rem",margin:"0.5rem 0 0 0",lineHeight:"1.5"},children:"Schedule and manage team meetings across all projects"})]}),(0,i.jsxs)("div",{className:"header-controls",children:[(0,i.jsxs)("div",{className:"filter-controls",children:[i.jsx("button",{onClick:()=>Z("list"),className:`filter-btn ${"list"===O?"active":""}`,children:"List View"}),i.jsx("button",{onClick:()=>Z("calendar"),className:`filter-btn ${"calendar"===O?"active":""}`,children:"Calendar View"})]}),(0,i.jsxs)("button",{onClick:()=>A(!0),className:"create-button",children:[i.jsx(d.Z,{style:{width:"20px",height:"20px"}}),"Schedule Meeting"]})]})]}),(0,i.jsxs)("div",{className:"timetable-stats",children:[(0,i.jsxs)("div",{className:"stat-item",children:[i.jsx("div",{className:"stat-label",children:"Total Meetings"}),i.jsx("div",{className:"stat-value total",children:w.length})]}),(0,i.jsxs)("div",{className:"stat-item",children:[i.jsx("div",{className:"stat-label",children:"Upcoming"}),i.jsx("div",{className:"stat-value upcoming",children:eL.length})]}),(0,i.jsxs)("div",{className:"stat-item",children:[i.jsx("div",{className:"stat-label",children:"Past Meetings"}),i.jsx("div",{className:"stat-value",children:eU.length})]}),(0,i.jsxs)("div",{className:"stat-item",children:[i.jsx("div",{className:"stat-label",children:"Active Projects"}),i.jsx("div",{className:"stat-value",children:v.length})]})]})]}),(0,i.jsxs)("div",{className:"main-content-area",children:[B&&i.jsx("div",{className:"error-message",children:B}),"calendar"===O&&(0,i.jsxs)("div",{className:"calendar-navigation",style:{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:"2rem",padding:"1.5rem",border:"2px solid #000000",borderRadius:"8px",background:"#ffffff",boxShadow:"0 2px 8px rgba(0, 0, 0, 0.1)",gap:"1rem"},children:[(0,i.jsxs)("div",{className:"calendar-nav-row-1",style:{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%"},children:[i.jsx("button",{onClick:()=>eK(),className:"nav-button",style:{padding:"0.75rem 1rem",border:"2px solid #000000",background:"#ffffff",borderRadius:"6px",cursor:"pointer",fontSize:"1rem",fontWeight:"600",transition:"all 0.2s ease"},onMouseOver:e=>{e.currentTarget.style.background="#f0f0f0",e.currentTarget.style.transform="translateY(-1px)"},onMouseOut:e=>{e.currentTarget.style.background="#ffffff",e.currentTarget.style.transform="translateY(0)"},children:"← Previous"}),(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"1rem",flex:1,justifyContent:"center"},children:[i.jsx("button",{onClick:()=>{G(new Date)},style:{padding:"0.5rem 1rem",border:"1px solid #6b7280",background:"#ffffff",borderRadius:"6px",cursor:"pointer",fontSize:"0.875rem",fontWeight:"500",color:"#6b7280",transition:"all 0.2s ease"},onMouseOver:e=>{e.currentTarget.style.background="#f9fafb",e.currentTarget.style.borderColor="#374151",e.currentTarget.style.color="#374151"},onMouseOut:e=>{e.currentTarget.style.background="#ffffff",e.currentTarget.style.borderColor="#6b7280",e.currentTarget.style.color="#6b7280"},children:"Today"}),i.jsx("h2",{style:{margin:0,fontSize:"1.5rem",fontWeight:"700",color:"#000000",textAlign:"center"},children:"month"===q?`${["January","February","March","April","May","June","July","August","September","October","November","December"][K.getMonth()]} ${K.getFullYear()}`:"week"===q?`Week of ${K.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`:K.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})})]}),i.jsx("button",{onClick:()=>eG(),className:"nav-button",style:{padding:"0.75rem 1rem",border:"2px solid #000000",background:"#ffffff",borderRadius:"6px",cursor:"pointer",fontSize:"1rem",fontWeight:"600",transition:"all 0.2s ease"},onMouseOver:e=>{e.currentTarget.style.background="#f0f0f0",e.currentTarget.style.transform="translateY(-1px)"},onMouseOut:e=>{e.currentTarget.style.background="#ffffff",e.currentTarget.style.transform="translateY(0)"},children:"Next →"})]}),(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"center",gap:"0.5rem"},children:[i.jsx("button",{onClick:()=>H("month"),style:{padding:"0.5rem 1rem",border:"month"===q?"2px solid #5884FD":"1px solid #d1d5db",background:"month"===q?"#5884FD":"#ffffff",color:"month"===q?"#ffffff":"#374151",borderRadius:"6px",cursor:"pointer",fontSize:"0.875rem",fontWeight:"500",transition:"all 0.2s ease"},onMouseOver:e=>{"month"!==q&&(e.currentTarget.style.background="#f9fafb",e.currentTarget.style.borderColor="#9ca3af")},onMouseOut:e=>{"month"!==q&&(e.currentTarget.style.background="#ffffff",e.currentTarget.style.borderColor="#d1d5db")},children:"Month"}),i.jsx("button",{onClick:()=>H("week"),style:{padding:"0.5rem 1rem",border:"week"===q?"2px solid #5884FD":"1px solid #d1d5db",background:"week"===q?"#5884FD":"#ffffff",color:"week"===q?"#ffffff":"#374151",borderRadius:"6px",cursor:"pointer",fontSize:"0.875rem",fontWeight:"500",transition:"all 0.2s ease"},onMouseOver:e=>{"week"!==q&&(e.currentTarget.style.background="#f9fafb",e.currentTarget.style.borderColor="#9ca3af")},onMouseOut:e=>{"week"!==q&&(e.currentTarget.style.background="#ffffff",e.currentTarget.style.borderColor="#d1d5db")},children:"Week"}),i.jsx("button",{onClick:()=>H("day"),style:{padding:"0.5rem 1rem",border:"day"===q?"2px solid #5884FD":"1px solid #d1d5db",background:"day"===q?"#5884FD":"#ffffff",color:"day"===q?"#ffffff":"#374151",borderRadius:"6px",cursor:"pointer",fontSize:"0.875rem",fontWeight:"500",transition:"all 0.2s ease"},onMouseOver:e=>{"day"!==q&&(e.currentTarget.style.background="#f9fafb",e.currentTarget.style.borderColor="#9ca3af")},onMouseOut:e=>{"day"!==q&&(e.currentTarget.style.background="#ffffff",e.currentTarget.style.borderColor="#d1d5db")},children:"Day"})]})]}),"list"===O&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)("div",{className:"meetings-section",children:[(0,i.jsxs)("h2",{className:"section-title",children:[i.jsx(m.Z,{style:{width:"20px",height:"20px",color:"#10b981"}}),"Upcoming Meetings (",eL.length,")"]}),0===eL.length?(0,i.jsxs)("div",{className:"empty-state",children:[i.jsx("div",{className:"empty-icon",children:i.jsx(l.Z,{style:{width:"32px",height:"32px",color:"#666666"}})}),i.jsx("h3",{style:{fontSize:"1.125rem",fontWeight:"600",color:"#000000",margin:"0 0 0.5rem 0"},children:"No upcoming meetings"}),i.jsx("p",{children:"Schedule your first meeting to get started"})]}):i.jsx("div",{className:"meetings-grid",children:eL.map(e=>(0,i.jsxs)("div",{className:"meeting-card",onClick:()=>eF(e),style:{cursor:"pointer"},children:[(0,i.jsxs)("div",{className:"meeting-header",children:[(0,i.jsxs)("div",{children:[i.jsx("h3",{className:"meeting-title",children:e.title}),i.jsx("p",{className:"meeting-project",children:e.project_name})]}),(0,i.jsxs)("div",{className:"meeting-actions",children:[i.jsx("button",{onClick:t=>{t.stopPropagation(),eE(e)},className:"action-btn",title:"Schedule follow-up",style:{background:"#dbeafe",color:"#2563eb"},children:i.jsx(p.Z,{style:{width:"16px",height:"16px"}})}),i.jsx("button",{onClick:t=>{t.stopPropagation(),ez(e)},className:"action-btn",title:"Edit meeting",children:i.jsx(c.Z,{style:{width:"16px",height:"16px"}})}),i.jsx("button",{onClick:t=>{t.stopPropagation(),eD(e.id)},className:"action-btn delete",title:"Delete meeting",children:i.jsx(g.Z,{style:{width:"16px",height:"16px"}})})]})]}),(0,i.jsxs)("div",{className:"meeting-details",children:[(0,i.jsxs)("div",{className:"detail-item",children:[i.jsx(m.Z,{style:{width:"16px",height:"16px"}}),i.jsx("span",{children:eA(e.date)})]}),(0,i.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"2px"},children:[(0,i.jsxs)("div",{className:"detail-item",children:[i.jsx(l.Z,{style:{width:"16px",height:"16px"}}),i.jsx("span",{style:{fontWeight:"600",fontSize:"11px",color:"#6B7280",minWidth:"24px"},children:"UK"}),i.jsx("span",{children:eR(e.time)}),(0,i.jsxs)("span",{style:{color:"#9CA3AF",fontSize:"12px"},children:["(",eP(e.duration),")"]})]}),(0,i.jsxs)("div",{className:"detail-item",style:{paddingLeft:"22px"},children:[i.jsx("span",{style:{fontWeight:"600",fontSize:"11px",color:"#D97706",minWidth:"24px"},children:"MM"}),i.jsx("span",{style:{color:"#B45309"},children:eR(eW(e.time))})]})]}),(0,i.jsxs)("div",{className:"detail-item",children:[i.jsx(x.Z,{style:{width:"16px",height:"16px"}}),(0,i.jsxs)("span",{children:["Organized by ",e.created_by.name]})]})]}),e.description&&i.jsx("p",{className:"meeting-description",children:e.description}),eQ(e).length>0&&(0,i.jsxs)("div",{children:[i.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"600",color:"#000000",marginBottom:"0.5rem"},children:"Attendees:"}),i.jsx("div",{className:"attendees-list",children:eQ(e).map((e,t)=>i.jsx("span",{className:"attendee-tag",children:e},t))})]}),(0,i.jsxs)("button",{onClick:t=>{t.stopPropagation(),eE(e)},style:{marginTop:"12px",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",width:"100%",padding:"8px 12px",background:"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",color:"#fff",border:"none",borderRadius:"8px",fontSize:"13px",fontWeight:"600",cursor:"pointer",transition:"all 0.2s ease"},children:[i.jsx(p.Z,{style:{width:"14px",height:"14px"}}),"Schedule Follow-up Meeting"]})]},e.id))})]}),eU.length>0&&(0,i.jsxs)("div",{className:"meetings-section",children:[(0,i.jsxs)("h2",{className:"section-title",children:[i.jsx(m.Z,{style:{width:"20px",height:"20px",color:"#6b7280"}}),"Past Meetings (",eU.length,")"]}),i.jsx("div",{className:"meetings-grid",children:eU.map(e=>(0,i.jsxs)("div",{className:"meeting-card",onClick:()=>eF(e),style:{opacity:"0.7",cursor:"pointer"},children:[(0,i.jsxs)("div",{className:"meeting-header",children:[(0,i.jsxs)("div",{children:[i.jsx("h3",{className:"meeting-title",children:e.title}),i.jsx("p",{className:"meeting-project",children:e.project_name})]}),(0,i.jsxs)("div",{className:"meeting-actions",children:[i.jsx("button",{onClick:t=>{t.stopPropagation(),eE(e)},className:"action-btn",title:"Schedule follow-up",style:{background:"#dbeafe",color:"#2563eb"},children:i.jsx(p.Z,{style:{width:"16px",height:"16px"}})}),i.jsx("button",{onClick:t=>{t.stopPropagation(),eD(e.id)},className:"action-btn delete",title:"Delete meeting",children:i.jsx(g.Z,{style:{width:"16px",height:"16px"}})})]})]}),(0,i.jsxs)("div",{className:"meeting-details",children:[(0,i.jsxs)("div",{className:"detail-item",children:[i.jsx(m.Z,{style:{width:"16px",height:"16px"}}),i.jsx("span",{children:eA(e.date)})]}),(0,i.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"2px"},children:[(0,i.jsxs)("div",{className:"detail-item",children:[i.jsx(l.Z,{style:{width:"16px",height:"16px"}}),i.jsx("span",{style:{fontWeight:"600",fontSize:"11px",color:"#6B7280",minWidth:"24px"},children:"UK"}),i.jsx("span",{children:eR(e.time)}),(0,i.jsxs)("span",{style:{color:"#9CA3AF",fontSize:"12px"},children:["(",eP(e.duration),")"]})]}),(0,i.jsxs)("div",{className:"detail-item",style:{paddingLeft:"22px"},children:[i.jsx("span",{style:{fontWeight:"600",fontSize:"11px",color:"#D97706",minWidth:"24px"},children:"MM"}),i.jsx("span",{style:{color:"#B45309"},children:eR(eW(e.time))})]})]}),(0,i.jsxs)("div",{className:"detail-item",children:[i.jsx(x.Z,{style:{width:"16px",height:"16px"}}),(0,i.jsxs)("span",{children:["Organized by ",e.created_by.name]})]})]}),e.description&&i.jsx("p",{className:"meeting-description",children:e.description}),eQ(e).length>0&&(0,i.jsxs)("div",{children:[i.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"600",color:"#000000",marginBottom:"0.5rem"},children:"Attendees:"}),i.jsx("div",{className:"attendees-list",children:eQ(e).map((e,t)=>i.jsx("span",{className:"attendee-tag",children:e},t))})]}),(0,i.jsxs)("button",{onClick:t=>{t.stopPropagation(),eE(e)},style:{marginTop:"12px",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",width:"100%",padding:"8px 12px",background:"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",color:"#fff",border:"none",borderRadius:"8px",fontSize:"13px",fontWeight:"600",cursor:"pointer",transition:"all 0.2s ease"},children:[i.jsx(p.Z,{style:{width:"14px",height:"14px"}}),"Schedule Follow-up Meeting"]})]},e.id))})]})]}),"calendar"===O&&(0,i.jsxs)(i.Fragment,{children:["month"===q&&i.jsx("div",{className:"calendar-view",style:{width:ee?"calc(100vw - 2rem)":"100%",maxWidth:ee?"calc(100vw - 2rem)":"100%",overflow:"hidden",padding:"0",margin:"0 auto",boxSizing:"border-box"},children:(0,i.jsxs)("div",{style:{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:"16px",overflow:"hidden",boxShadow:"0 4px 12px rgba(0, 0, 0, 0.05)"},children:[i.jsx("div",{className:"calendar-header-grid",style:{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",background:"#F9FAFB",borderBottom:"1px solid #E5E7EB",width:"100%",minWidth:"100%"},children:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(e=>i.jsx("div",{style:{padding:"1rem",textAlign:"center",fontWeight:"600",color:"#374151",borderRight:"1px solid #E5E7EB",fontFamily:"'Mabry Pro', 'Inter', sans-serif",fontSize:"0.75rem",letterSpacing:"0.05em",textTransform:"uppercase"},children:e},e))}),(0,i.jsxs)("div",{className:"calendar-body-grid",style:{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",width:"100%",minWidth:"100%",gap:"0"},children:[Array.from({length:eX},(e,t)=>{let r=new Date(K.getFullYear(),K.getMonth()-1),n=eY(r);return i.jsx("div",{className:"calendar-cell other-month",style:{minHeight:"150px",padding:"0.75rem",borderRight:"1px solid #E5E7EB",borderBottom:"1px solid #E5E7EB",background:"#F9FAFB",color:"#9CA3AF"},children:i.jsx("div",{style:{fontWeight:"600",color:"#9CA3AF",marginBottom:"0.5rem",fontFamily:"'Mabry Pro', 'Inter', sans-serif",fontSize:"1rem"},children:n-eX+t+1})},`prev-${t}`)}),Array.from({length:eJ},(e,t)=>{let r=t+1,n=new Date(K.getFullYear(),K.getMonth(),r),a=K.getMonth()===eV.getMonth()&&K.getFullYear()===eV.getFullYear()&&r===eV.getDate(),o=eZ(n);return(0,i.jsxs)("div",{className:`calendar-cell ${a?"today":""}`,style:{minHeight:"150px",padding:"0.75rem",borderRight:"1px solid #E5E7EB",borderBottom:"1px solid #E5E7EB",background:a?"rgba(88, 132, 253, 0.05)":"#FFFFFF",transition:"all 0.2s ease",cursor:"pointer",...a&&{borderRight:"1px solid #5884FD",borderBottom:"1px solid #5884FD",position:"relative"}},onMouseEnter:e=>{a||(e.currentTarget.style.background="#F9FAFB")},onMouseLeave:e=>{a||(e.currentTarget.style.background="#FFFFFF")},onClick:()=>{let e=n.getFullYear(),t=String(n.getMonth()+1).padStart(2,"0"),r=String(n.getDate()).padStart(2,"0"),i=`${e}-${t}-${r}`;ea({...en,date:i,time:"09:00"}),A(!0)},children:[a&&i.jsx("div",{style:{position:"absolute",top:0,left:0,width:"4px",height:"100%",background:"#5884FD"}}),i.jsx("div",{style:{fontWeight:a?"700":"600",color:a?"#5884FD":"#1F2937",marginBottom:"0.5rem",fontFamily:"'Mabry Pro', 'Inter', sans-serif",fontSize:"1rem"},children:r}),(0,i.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"0.25rem"},children:[(o||[]).slice(0,3).map(e=>(0,i.jsxs)("div",{style:{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:"8px",padding:"0.5rem",fontSize:"0.75rem",marginBottom:"0.25rem",cursor:"pointer",transition:"all 0.2s ease",borderLeft:"3px solid #5884FD"},onClick:t=>{t.stopPropagation(),eF(e)},onMouseEnter:e=>{e.currentTarget.style.background="#F1F5F9",e.currentTarget.style.borderColor="#5884FD",e.currentTarget.style.borderLeftColor="#5884FD"},onMouseLeave:e=>{e.currentTarget.style.background="#F8FAFC",e.currentTarget.style.borderColor="#E2E8F0",e.currentTarget.style.borderLeftColor="#5884FD"},children:[i.jsx("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.25rem"},children:i.jsx("div",{style:{fontWeight:"500",color:"#1F2937",lineHeight:"1.3",flex:1,marginRight:"0.25rem",fontFamily:"'Mabry Pro', 'Inter', sans-serif"},children:e.title})}),(0,i.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"2px",fontSize:"0.625rem"},children:[(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"3px"},children:[i.jsx("span",{style:{fontWeight:"600",color:"#1E3A5F",fontSize:"9px"},children:"UK"}),i.jsx("span",{style:{color:"#0369A1",fontWeight:"500"},children:eR(e.time)})]}),(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"2px",color:"#6B7280"},children:[i.jsx(x.Z,{style:{width:"9px",height:"9px"}}),i.jsx("span",{style:{fontSize:"9px"},children:e.created_by.name.split(" ")[0]})]})]}),(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"3px"},children:[i.jsx("span",{style:{fontWeight:"600",color:"#92400E",fontSize:"9px"},children:"MM"}),i.jsx("span",{style:{color:"#B45309",fontWeight:"500"},children:eR(eW(e.time))})]})]})]},e.id)),(o||[]).length>3&&(0,i.jsxs)("div",{style:{background:"#EEF2FF",border:"1px solid #C7D2FE",borderRadius:"6px",padding:"0.375rem 0.5rem",fontSize:"0.6875rem",color:"#5B21B6",textAlign:"center",cursor:"pointer",transition:"all 0.2s ease",fontWeight:"500",fontFamily:"'Mabry Pro', 'Inter', sans-serif"},onClick:e=>{e.stopPropagation(),e0(n,o||[])},onMouseEnter:e=>{e.currentTarget.style.background="#E0E7FF",e.currentTarget.style.borderColor="#A5B4FC"},onMouseLeave:e=>{e.currentTarget.style.background="#EEF2FF",e.currentTarget.style.borderColor="#C7D2FE"},children:["+",(o||[]).length-3," more"]})]})]},r)}),Array.from({length:42-(eX+eJ)},(e,t)=>i.jsx("div",{className:"calendar-cell other-month",style:{minHeight:"150px",padding:"0.75rem",borderRight:"1px solid #E5E7EB",borderBottom:"1px solid #E5E7EB",background:"#F9FAFB",color:"#9CA3AF"},children:i.jsx("div",{style:{fontWeight:"600",color:"#9CA3AF",marginBottom:"0.5rem",fontFamily:"'Mabry Pro', 'Inter', sans-serif",fontSize:"1rem"},children:t+1})},`next-${t}`))]})]})}),"week"===q&&i.jsx("div",{className:"calendar-view",style:{width:ee?"calc(100vw - 2rem)":"100%",maxWidth:ee?"calc(100vw - 2rem)":"100%",overflow:"hidden",padding:"0",margin:"0 auto",boxSizing:"border-box"},children:(0,i.jsxs)("div",{style:{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:"16px",overflow:"hidden",boxShadow:"0 4px 12px rgba(0, 0, 0, 0.05)",minHeight:"600px"},children:[i.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",background:"#F9FAFB",borderBottom:"1px solid #E5E7EB"},children:eq(K).map((e,t)=>i.jsx("div",{style:{padding:"1rem",textAlign:"center",fontWeight:"600",color:"#374151",borderRight:t<6?"1px solid #E5E7EB":"none",fontFamily:"'Mabry Pro', 'Inter', sans-serif",fontSize:"0.875rem"},children:i.jsx("div",{children:eH(e)})},t))}),i.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",minHeight:"500px"},children:eq(K).map((e,t)=>{let r=eZ(e),n=e.toDateString()===new Date().toDateString();return(0,i.jsxs)("div",{style:{padding:"1rem",borderRight:t<6?"1px solid #E5E7EB":"none",background:n?"rgba(88, 132, 253, 0.05)":"#FFFFFF",minHeight:"500px",position:"relative"},children:[n&&i.jsx("div",{style:{position:"absolute",top:0,left:0,width:"4px",height:"100%",background:"#5884FD"}}),i.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem"},children:r.map(e=>(0,i.jsxs)("div",{onClick:()=>eF(e),style:{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:"8px",padding:"0.75rem",fontSize:"0.875rem",cursor:"pointer",transition:"all 0.2s ease",borderLeft:"3px solid #5884FD"},onMouseOver:e=>{e.currentTarget.style.background="#F1F5F9",e.currentTarget.style.borderColor="#5884FD"},onMouseOut:e=>{e.currentTarget.style.background="#F8FAFC",e.currentTarget.style.borderColor="#E2E8F0"},children:[i.jsx("div",{style:{fontWeight:"600",color:"#1F2937",marginBottom:"0.25rem"},children:e.title}),(0,i.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"2px",fontSize:"0.7rem"},children:[(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"4px"},children:[i.jsx("span",{style:{fontWeight:"600",color:"#1E3A5F",fontSize:"10px"},children:"UK"}),i.jsx("span",{style:{color:"#0369A1"},children:eR(e.time)})]}),(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"4px"},children:[i.jsx("span",{style:{fontWeight:"600",color:"#92400E",fontSize:"10px"},children:"MM"}),i.jsx("span",{style:{color:"#B45309"},children:eR(eW(e.time))})]})]})]},e.id))})]},t)})})]})}),"day"===q&&i.jsx("div",{className:"calendar-view",style:{width:ee?"calc(100vw - 2rem)":"100%",maxWidth:ee?"calc(100vw - 2rem)":"100%",overflow:"hidden",padding:"0",margin:"0 auto",boxSizing:"border-box"},children:(0,i.jsxs)("div",{style:{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:"16px",overflow:"hidden",boxShadow:"0 4px 12px rgba(0, 0, 0, 0.05)",minHeight:"700px"},children:[i.jsx("div",{style:{background:"#F9FAFB",borderBottom:"1px solid #E5E7EB",padding:"1.5rem",textAlign:"center"},children:i.jsx("h3",{style:{margin:0,fontSize:"1.25rem",fontWeight:"600",color:"#1F2937",fontFamily:"'Mabry Pro', 'Inter', sans-serif"},children:K.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})})}),i.jsx("div",{style:{padding:"1rem"},children:Array.from({length:24},(e,t)=>{let r=`${t.toString().padStart(2,"0")}:00`,n=eZ(K).filter(e=>e.time.startsWith(t.toString().padStart(2,"0")));return(0,i.jsxs)("div",{style:{display:"flex",borderBottom:"1px solid #F3F4F6",minHeight:"60px",alignItems:"flex-start"},children:[i.jsx("div",{style:{width:"80px",padding:"0.5rem",fontSize:"0.875rem",color:"#6B7280",fontWeight:"500",textAlign:"right",borderRight:"1px solid #F3F4F6"},children:r}),i.jsx("div",{style:{flex:1,padding:"0.5rem",display:"flex",flexDirection:"column",gap:"0.25rem"},children:n.map(e=>(0,i.jsxs)("div",{onClick:()=>eF(e),style:{background:"#EEF2FF",border:"1px solid #C7D2FE",borderRadius:"8px",padding:"0.75rem",cursor:"pointer",transition:"all 0.2s ease",borderLeft:"4px solid #5884FD"},onMouseOver:e=>{e.currentTarget.style.background="#E0E7FF",e.currentTarget.style.borderColor="#A5B4FC"},onMouseOut:e=>{e.currentTarget.style.background="#EEF2FF",e.currentTarget.style.borderColor="#C7D2FE"},children:[i.jsx("div",{style:{fontWeight:"600",color:"#1F2937",marginBottom:"0.25rem",fontSize:"1rem"},children:e.title}),(0,i.jsxs)("div",{style:{fontSize:"0.875rem",marginBottom:"0.25rem",display:"flex",alignItems:"center",gap:"8px"},children:[(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"4px"},children:[i.jsx("span",{style:{fontWeight:"600",color:"#1E3A5F",fontSize:"11px"},children:"UK"}),i.jsx("span",{style:{color:"#0369A1"},children:eR(e.time)})]}),i.jsx("span",{style:{color:"#D1D5DB"},children:"|"}),(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"4px"},children:[i.jsx("span",{style:{fontWeight:"600",color:"#92400E",fontSize:"11px"},children:"MM"}),i.jsx("span",{style:{color:"#B45309"},children:eR(eW(e.time))})]}),i.jsx("span",{style:{color:"#D1D5DB"},children:"•"}),i.jsx("span",{style:{color:"#6B7280"},children:e.project_name})]}),e.description&&i.jsx("div",{style:{fontSize:"0.75rem",color:"#9CA3AF"},children:e.description})]},e.id))})]},t)})})]})})]})]})]})]}),L&&I&&i.jsx(b.Z,{meeting:I,onClose:()=>{U(!1),P(null)},onUpdate:ek,onDelete:eS,onFollowUp:e=>{U(!1),P(null),eE(e)},projectMembers:z,projects:v,onProjectChange:e=>{ej(e)}}),V&&er&&i.jsx("div",{className:"modal-overlay",onClick:()=>{J(!1),ei(null),Q([])},children:(0,i.jsxs)("div",{className:"modal-content",onClick:e=>e.stopPropagation(),children:[(0,i.jsxs)("div",{className:"modal-header",children:[(0,i.jsxs)("h2",{className:"modal-title",children:["Meetings for ",er.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})]}),i.jsx("button",{type:"button",onClick:()=>{J(!1),ei(null),Q([])},className:"modal-close-btn",children:"\xd7"})]}),i.jsx("div",{className:"modal-body",style:{maxHeight:"400px",overflowY:"auto"},children:0===X.length?i.jsx("p",{style:{textAlign:"center",color:"#666666",padding:"2rem"},children:"No meetings scheduled for this day"}):i.jsx("div",{className:"meetings-list",style:{display:"flex",flexDirection:"column",gap:"0.75rem"},children:X.map(e=>(0,i.jsxs)("div",{className:"meeting-item",style:{padding:"1rem",border:"2px solid #e0e0e0",borderRadius:"8px",background:"#ffffff",cursor:"pointer",transition:"all 0.2s ease"},onClick:()=>{J(!1),ei(null),Q([]),eF(e)},onMouseOver:e=>{e.currentTarget.style.background="#f5f5f5",e.currentTarget.style.borderColor="#000000"},onMouseOut:e=>{e.currentTarget.style.background="#ffffff",e.currentTarget.style.borderColor="#e0e0e0"},children:[(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"},children:[(0,i.jsxs)("div",{children:[i.jsx("h4",{style:{margin:0,fontSize:"1rem",fontWeight:"600",color:"#000000"},children:e.title}),i.jsx("p",{style:{margin:"0.25rem 0 0 0",fontSize:"0.875rem",color:"#666666"},children:e.project_name})]}),(0,i.jsxs)("div",{style:{display:"flex",gap:"0.5rem"},children:[i.jsx("button",{onClick:t=>{t.stopPropagation(),J(!1),ei(null),Q([]),ez(e)},style:{padding:"0.25rem",border:"1px solid #e0e0e0",background:"#ffffff",borderRadius:"4px",cursor:"pointer",fontSize:"0.75rem"},title:"Edit meeting",children:"✏️"}),i.jsx("button",{onClick:t=>{t.stopPropagation(),eD(e.id),Q(X.filter(t=>t.id!==e.id))},style:{padding:"0.25rem",border:"1px solid #e0e0e0",background:"#ffffff",borderRadius:"4px",cursor:"pointer",fontSize:"0.75rem"},title:"Delete meeting",children:"\uD83D\uDDD1️"})]})]}),(0,i.jsxs)("div",{style:{display:"flex",gap:"1rem",fontSize:"0.875rem",color:"#666666"},children:[(0,i.jsxs)("span",{children:["\uD83D\uDD50 ",eR(e.time)]}),(0,i.jsxs)("span",{children:["⏱️ ",eP(e.duration)]}),(0,i.jsxs)("span",{children:["\uD83D\uDC64 ",e.created_by.name]})]}),e.description&&i.jsx("p",{style:{margin:"0.5rem 0 0 0",fontSize:"0.875rem",color:"#333333",lineHeight:"1.4"},children:e.description}),eQ(e).length>0&&(0,i.jsxs)("div",{style:{marginTop:"0.5rem"},children:[i.jsx("span",{style:{fontSize:"0.75rem",fontWeight:"600",color:"#666666"},children:"Attendees:"}),i.jsx("span",{style:{fontSize:"0.75rem",color:"#333333"},children:eQ(e).join(", ")})]})]},e.id))})})]})}),T&&i.jsx("div",{className:"modal-overlay",onClick:()=>{A(!1),W(null),ea({title:"",description:"",date:"",time:"",duration:60,project_id:0,attendees:"",attendee_ids:[],agenda_items:[],meeting_link:"",reminder_time:15,isRecurring:!1,endDate:"",repeatDays:[],timezone:"UK"})},children:(0,i.jsxs)("div",{className:"modal-content",onClick:e=>e.stopPropagation(),children:[(0,i.jsxs)("div",{className:"modal-header",children:[i.jsx("h2",{className:"modal-title",children:R?"Edit Meeting":"Schedule New Meeting"}),i.jsx("button",{type:"button",onClick:()=>{A(!1),W(null),ea({title:"",description:"",date:"",time:"",duration:60,project_id:0,attendees:"",attendee_ids:[],agenda_items:[],meeting_link:"",reminder_time:15,isRecurring:!1,endDate:"",repeatDays:[],timezone:"UK"})},className:"modal-close-btn",children:"\xd7"})]}),(0,i.jsxs)("form",{onSubmit:R?e_:ew,className:"modal-form",children:[(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Meeting Title *"}),i.jsx("input",{type:"text",required:!0,className:"form-input",placeholder:"Enter meeting title...",value:en.title,onChange:e=>ea({...en,title:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Description"}),i.jsx("textarea",{className:"form-textarea",placeholder:"What will be discussed in this meeting?",value:en.description,onChange:e=>ea({...en,description:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Project *"}),(0,i.jsxs)("select",{required:!0,className:"form-select",value:en.project_id,onChange:e=>ea({...en,project_id:Number(e.target.value)}),children:[i.jsx("option",{value:0,children:"Select a project"}),v.map(e=>i.jsx("option",{value:e.id,children:e.name},e.id))]})]}),(0,i.jsxs)("div",{className:"form-grid-3",children:[(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Date *"}),i.jsx("input",{type:"date",required:!0,className:"form-input",value:en.date,onChange:e=>ea({...en,date:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Timezone"}),(0,i.jsxs)("select",{className:"form-select",value:en.timezone,onChange:e=>ea({...en,timezone:e.target.value}),style:{marginBottom:"8px"},children:[i.jsx("option",{value:"UK",children:"UK (GMT/BST)"}),i.jsx("option",{value:"MM",children:"Myanmar (MMT)"})]}),i.jsx("label",{className:"form-label",children:"Time *"}),i.jsx("input",{type:"time",required:!0,className:"form-input",value:en.time,onChange:e=>ea({...en,time:e.target.value})}),en.time&&(0,i.jsxs)("div",{style:{marginTop:"8px",padding:"10px 12px",background:"linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)",borderRadius:"8px",border:"1px solid #BAE6FD",fontSize:"12px"},children:[i.jsx("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"},children:(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"6px"},children:[i.jsx("span",{style:{fontWeight:"700",color:"#1E3A5F",fontSize:"11px"},children:"UK"}),i.jsx("span",{style:{color:"#0369A1",fontWeight:"500"},children:eR("UK"===en.timezone?en.time:eI(en.time))})]})}),i.jsx("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"6px"},children:[i.jsx("span",{style:{fontWeight:"700",color:"#92400E",fontSize:"11px"},children:"MM"}),i.jsx("span",{style:{color:"#B45309",fontWeight:"500"},children:eR("MM"===en.timezone?en.time:eW(en.time))})]})})]})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Duration"}),i.jsx("input",{type:"number",min:"15",max:"480",step:"15",className:"form-input",placeholder:"Minutes",value:en.duration,onChange:e=>ea({...en,duration:Number(e.target.value)})})]})]}),!R&&(0,i.jsxs)("div",{style:{padding:"16px",background:en.isRecurring?"#EFF6FF":"#F9FAFB",borderRadius:"12px",border:en.isRecurring?"2px solid #3B82F6":"1px solid #E5E7EB",marginBottom:"16px"},children:[(0,i.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"12px",cursor:"pointer",fontWeight:"600",color:"#374151"},children:[i.jsx("input",{type:"checkbox",checked:en.isRecurring,onChange:e=>ea({...en,isRecurring:e.target.checked}),style:{width:"18px",height:"18px",accentColor:"#3B82F6"}}),i.jsx("span",{children:"Recurring Meeting"})]}),en.isRecurring&&(0,i.jsxs)("div",{style:{marginTop:"16px"},children:[(0,i.jsxs)("div",{style:{marginBottom:"16px"},children:[i.jsx("label",{style:{display:"block",marginBottom:"6px",fontWeight:"500",color:"#374151",fontSize:"14px"},children:"End Date *"}),i.jsx("input",{type:"date",className:"form-input",value:en.endDate,min:en.date,onChange:e=>ea({...en,endDate:e.target.value}),style:{width:"100%"}})]}),(0,i.jsxs)("div",{children:[i.jsx("label",{style:{display:"block",marginBottom:"8px",fontWeight:"500",color:"#374151",fontSize:"14px"},children:"Repeat on Days *"}),i.jsx("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap"},children:[{day:0,label:"Sun"},{day:1,label:"Mon"},{day:2,label:"Tue"},{day:3,label:"Wed"},{day:4,label:"Thu"},{day:5,label:"Fri"},{day:6,label:"Sat"}].map(({day:e,label:t})=>i.jsx("button",{type:"button",onClick:()=>{let t=en.repeatDays.includes(e)?en.repeatDays.filter(t=>t!==e):[...en.repeatDays,e];ea({...en,repeatDays:t})},style:{padding:"8px 14px",borderRadius:"8px",border:en.repeatDays.includes(e)?"2px solid #3B82F6":"1px solid #D1D5DB",background:en.repeatDays.includes(e)?"#3B82F6":"white",color:en.repeatDays.includes(e)?"white":"#374151",fontWeight:"600",fontSize:"13px",cursor:"pointer",transition:"all 0.2s ease"},children:t},e))}),en.repeatDays.length>0&&(0,i.jsxs)("p",{style:{marginTop:"8px",fontSize:"13px",color:"#6B7280"},children:["Meeting will repeat every ",en.repeatDays.sort((e,t)=>e-t).map(e=>["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][e]).join(", ")," from ",en.date||"start date"," to ",en.endDate||"end date"]})]})]})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Invite Attendees (Optional)"}),en.attendee_ids.length>0&&i.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.5rem",marginBottom:"0.75rem",padding:"0.75rem",backgroundColor:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"6px"},children:en.attendee_ids.map(e=>{let t=z.find(t=>t.id===e);return t?(0,i.jsxs)("span",{style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.25rem 0.75rem",backgroundColor:"#000000",color:"#ffffff",borderRadius:"20px",fontSize:"0.875rem"},children:[t.name,i.jsx("button",{type:"button",onClick:()=>ea(t=>({...t,attendee_ids:t.attendee_ids.filter(t=>t!==e)})),style:{background:"none",border:"none",color:"#ffffff",cursor:"pointer",fontSize:"1rem",lineHeight:"1"},children:"\xd7"})]},e):null})}),z.length>0?i.jsx("div",{style:{border:"2px solid #e5e7eb",borderRadius:"6px",maxHeight:"200px",overflowY:"auto"},children:z.map(e=>{let t=en.attendee_ids.includes(e.id);return(0,i.jsxs)("div",{onClick:()=>{ea(r=>({...r,attendee_ids:t?r.attendee_ids.filter(t=>t!==e.id):[...r.attendee_ids,e.id]}))},style:{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",borderBottom:"1px solid #e5e7eb",cursor:"pointer",backgroundColor:t?"#f0f9ff":"#ffffff",borderLeft:t?"4px solid #000000":"4px solid transparent"},children:[i.jsx("input",{type:"checkbox",checked:t,onChange:()=>{},style:{cursor:"pointer"}}),(0,i.jsxs)("div",{style:{flex:1},children:[i.jsx("div",{style:{fontWeight:"500",color:"#000000"},children:e.name}),i.jsx("div",{style:{fontSize:"0.875rem",color:"#6b7280"},children:e.email})]})]},e.id)})}):i.jsx("div",{style:{padding:"2rem",textAlign:"center",color:"#6b7280",border:"2px dashed #e5e7eb",borderRadius:"6px"},children:"Select a project first to see available members"})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Meeting Agenda"}),(0,i.jsxs)("div",{style:{display:"flex",gap:"8px",marginBottom:"12px"},children:[i.jsx("input",{type:"text",className:"form-input",placeholder:"Add agenda item...",value:eo,onChange:e=>es(e.target.value),onKeyPress:e=>{"Enter"===e.key&&eo.trim()&&(e.preventDefault(),ea({...en,agenda_items:[...en.agenda_items,eo.trim()]}),es(""))},style:{flex:1}}),(0,i.jsxs)("button",{type:"button",onClick:()=>{eo.trim()&&(ea({...en,agenda_items:[...en.agenda_items,eo.trim()]}),es(""))},style:{padding:"10px 16px",background:"#10B981",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px",fontWeight:"600"},children:[i.jsx(d.Z,{style:{width:"16px",height:"16px"}}),"Add"]})]}),en.agenda_items.length>0?i.jsx("div",{style:{border:"1px solid #E5E7EB",borderRadius:"8px",overflow:"hidden",background:"#F9FAFB"},children:en.agenda_items.map((e,t)=>(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:t<en.agenda_items.length-1?"1px solid #E5E7EB":"none",background:"white"},children:[(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[i.jsx("span",{style:{width:"24px",height:"24px",borderRadius:"50%",background:"#5884FD",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:"600"},children:t+1}),i.jsx("span",{style:{fontSize:"14px",color:"#374151"},children:e})]}),i.jsx("button",{type:"button",onClick:()=>{ea({...en,agenda_items:en.agenda_items.filter((e,r)=>r!==t)})},style:{padding:"4px 8px",background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"12px"},children:"Remove"})]},t))}):i.jsx("div",{style:{padding:"24px",textAlign:"center",color:"#9CA3AF",border:"2px dashed #E5E7EB",borderRadius:"8px",fontSize:"14px"},children:"No agenda items yet. Add items to keep your meeting focused."})]}),(0,i.jsxs)("div",{className:"form-group",children:[(0,i.jsxs)("label",{className:"form-label",style:{display:"flex",alignItems:"center",gap:"8px"},children:[i.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor",style:{width:"18px",height:"18px",color:"#3b82f6"},children:i.jsx("path",{strokeLinecap:"round",d:"M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"})}),"Meeting Link (Zoom/Google Meet/Teams)"]}),i.jsx("input",{type:"url",className:"form-input",placeholder:"https://zoom.us/j/... or https://meet.google.com/...",value:en.meeting_link,onChange:e=>ea({...en,meeting_link:e.target.value}),style:{borderColor:en.meeting_link?"#3b82f6":void 0,background:en.meeting_link?"#eff6ff":void 0}}),i.jsx("p",{style:{fontSize:"12px",color:"#6B7280",marginTop:"4px"},children:"Add a video call link for remote attendees"})]}),(0,i.jsxs)("div",{className:"form-group",children:[(0,i.jsxs)("label",{className:"form-label",style:{display:"flex",alignItems:"center",gap:"8px"},children:[i.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor",style:{width:"18px",height:"18px",color:"#f59e0b"},children:i.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"})}),"Email Reminder"]}),(0,i.jsxs)("select",{className:"form-select",value:en.reminder_time,onChange:e=>ea({...en,reminder_time:Number(e.target.value)}),style:{borderColor:"#f59e0b",background:"#fffbeb"},children:[i.jsx("option",{value:0,children:"No reminder"}),i.jsx("option",{value:5,children:"5 minutes before"}),i.jsx("option",{value:10,children:"10 minutes before"}),i.jsx("option",{value:15,children:"15 minutes before"}),i.jsx("option",{value:30,children:"30 minutes before"}),i.jsx("option",{value:60,children:"1 hour before"}),i.jsx("option",{value:120,children:"2 hours before"}),i.jsx("option",{value:1440,children:"1 day before"})]}),i.jsx("p",{style:{fontSize:"12px",color:"#6B7280",marginTop:"4px"},children:"Send an email notification to all attendees before the meeting starts"})]}),(0,i.jsxs)("div",{className:"form-actions",children:[i.jsx("button",{type:"submit",className:"btn-primary",children:R?"Update Meeting":"Schedule Meeting"}),i.jsx("button",{type:"button",onClick:()=>{A(!1),W(null),ea({title:"",description:"",date:"",time:"",duration:60,project_id:0,attendees:"",attendee_ids:[],agenda_items:[],meeting_link:"",reminder_time:15,isRecurring:!1,endDate:"",repeatDays:[],timezone:"UK"})},className:"btn-secondary",children:"Cancel"})]})]})]})}),el&&em&&i.jsx("div",{className:"modal-overlay",onClick:()=>ed(!1),style:{position:"fixed",inset:0,background:"rgba(15, 23, 42, 0.6)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:"20px"},children:(0,i.jsxs)("div",{onClick:e=>e.stopPropagation(),style:{background:"#fff",borderRadius:"20px",maxWidth:"560px",width:"100%",maxHeight:"90vh",overflow:"hidden",boxShadow:"0 25px 50px -12px rgba(0,0,0,0.25)"},children:[i.jsx("div",{style:{background:"#1F2937",padding:"24px",color:"#fff"},children:(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"},children:[(0,i.jsxs)("div",{children:[i.jsx("p",{style:{margin:"0 0 8px",fontSize:"12px",fontWeight:"600",color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.05em"},children:"Schedule Follow-up"}),i.jsx("h2",{style:{margin:0,fontSize:"20px",fontWeight:"700",color:"#fff"},children:em.title.replace(/^(Follow-up:\s*)+/i,"")}),(0,i.jsxs)("div",{style:{marginTop:"12px",display:"flex",alignItems:"center",gap:"16px"},children:[(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"6px",fontSize:"13px",color:"#9CA3AF"},children:[i.jsx(m.Z,{style:{width:"14px",height:"14px"}}),eA(em.date)]}),(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"6px",fontSize:"13px",color:"#9CA3AF"},children:[i.jsx(l.Z,{style:{width:"14px",height:"14px"}}),eR(em.time)]})]})]}),i.jsx("button",{onClick:()=>ed(!1),style:{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"10px",padding:"10px",cursor:"pointer",transition:"background 0.2s"},onMouseEnter:e=>e.currentTarget.style.background="rgba(255,255,255,0.2)",onMouseLeave:e=>e.currentTarget.style.background="rgba(255,255,255,0.1)",children:i.jsx(f.Z,{style:{width:"20px",height:"20px",color:"#fff"}})})]})}),(0,i.jsxs)("form",{onSubmit:eC,style:{padding:"24px",overflowY:"auto",maxHeight:"calc(90vh - 140px)"},children:[(0,i.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px",marginBottom:"20px"},children:[(0,i.jsxs)("div",{children:[i.jsx("label",{style:{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.05em"},children:"Date"}),i.jsx("input",{type:"date",value:ec.date,onChange:e=>eg(t=>({...t,date:e.target.value})),required:!0,style:{width:"100%",padding:"12px 14px",border:"1px solid #E5E7EB",borderRadius:"10px",fontSize:"14px",outline:"none",background:"#F9FAFB",transition:"border-color 0.2s, box-shadow 0.2s"},onFocus:e=>{e.currentTarget.style.borderColor="#3B82F6",e.currentTarget.style.boxShadow="0 0 0 3px rgba(59, 130, 246, 0.1)"},onBlur:e=>{e.currentTarget.style.borderColor="#E5E7EB",e.currentTarget.style.boxShadow="none"}})]}),(0,i.jsxs)("div",{children:[i.jsx("label",{style:{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.05em"},children:"Time (UK)"}),i.jsx("input",{type:"time",value:ec.time,onChange:e=>eg(t=>({...t,time:e.target.value})),required:!0,style:{width:"100%",padding:"12px 14px",border:"1px solid #E5E7EB",borderRadius:"10px",fontSize:"14px",outline:"none",background:"#F9FAFB",transition:"border-color 0.2s, box-shadow 0.2s"},onFocus:e=>{e.currentTarget.style.borderColor="#3B82F6",e.currentTarget.style.boxShadow="0 0 0 3px rgba(59, 130, 246, 0.1)"},onBlur:e=>{e.currentTarget.style.borderColor="#E5E7EB",e.currentTarget.style.boxShadow="none"}}),ec.time&&(0,i.jsxs)("div",{style:{marginTop:"4px",fontSize:"11px",color:"#D97706",fontWeight:"500"},children:["MM: ",eR(eW(ec.time))]})]}),(0,i.jsxs)("div",{children:[i.jsx("label",{style:{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.05em"},children:"Duration"}),(0,i.jsxs)("select",{value:ec.duration,onChange:e=>eg(t=>({...t,duration:Number(e.target.value)})),style:{width:"100%",padding:"12px 14px",border:"1px solid #E5E7EB",borderRadius:"10px",fontSize:"14px",outline:"none",background:"#F9FAFB",cursor:"pointer"},children:[i.jsx("option",{value:15,children:"15 min"}),i.jsx("option",{value:30,children:"30 min"}),i.jsx("option",{value:45,children:"45 min"}),i.jsx("option",{value:60,children:"1 hour"}),i.jsx("option",{value:90,children:"1.5 hours"}),i.jsx("option",{value:120,children:"2 hours"})]})]})]}),(0,i.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"2fr 1fr",gap:"12px",marginBottom:"20px"},children:[(0,i.jsxs)("div",{children:[i.jsx("label",{style:{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.05em"},children:"Meeting Link"}),i.jsx("input",{type:"url",value:ec.meeting_link,onChange:e=>eg(t=>({...t,meeting_link:e.target.value})),placeholder:"https://zoom.us/j/...",style:{width:"100%",padding:"12px 14px",border:"1px solid #E5E7EB",borderRadius:"10px",fontSize:"14px",outline:"none",background:"#F9FAFB",transition:"border-color 0.2s, box-shadow 0.2s"},onFocus:e=>{e.currentTarget.style.borderColor="#3B82F6",e.currentTarget.style.boxShadow="0 0 0 3px rgba(59, 130, 246, 0.1)"},onBlur:e=>{e.currentTarget.style.borderColor="#E5E7EB",e.currentTarget.style.boxShadow="none"}})]}),(0,i.jsxs)("div",{children:[i.jsx("label",{style:{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.05em"},children:"Reminder"}),(0,i.jsxs)("select",{value:ec.reminder_time,onChange:e=>eg(t=>({...t,reminder_time:Number(e.target.value)})),style:{width:"100%",padding:"12px 14px",border:"1px solid #E5E7EB",borderRadius:"10px",fontSize:"14px",outline:"none",background:"#F9FAFB",cursor:"pointer"},children:[i.jsx("option",{value:0,children:"None"}),i.jsx("option",{value:5,children:"5 min"}),i.jsx("option",{value:15,children:"15 min"}),i.jsx("option",{value:30,children:"30 min"}),i.jsx("option",{value:60,children:"1 hour"})]})]})]}),(0,i.jsxs)("div",{style:{marginBottom:"20px"},children:[i.jsx("label",{style:{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.05em"},children:"Attendees"}),(()=>{let e=em?.attendee_ids||[],t=em?.attendees_list||(em?.attendees?em.attendees.split(",").map(e=>e.trim()).filter(e=>e):[]),r=e.length>0?k.filter(t=>e.includes(t.id)):t.map((e,t)=>({id:t,name:e,email:""}));return 0===r.length&&t.length>0?i.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"8px",padding:"12px",background:"#f9fafb",borderRadius:"8px"},children:t.map((e,t)=>(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"6px",padding:"6px 10px",background:"#dbeafe",border:"2px solid #3b82f6",borderRadius:"20px",fontSize:"13px"},children:[i.jsx("span",{style:{width:"24px",height:"24px",borderRadius:"50%",background:"#3b82f6",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"600"},children:e.charAt(0).toUpperCase()}),e,i.jsx(h.Z,{style:{width:"14px",height:"14px",color:"#3b82f6"}})]},t))}):r.length>0?i.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"8px",padding:"12px",background:"#f9fafb",borderRadius:"8px",maxHeight:"200px",overflowY:"auto"},children:r.map(e=>{let t=e.id||e.user_id,r=ec.attendee_ids.includes(t);return(0,i.jsxs)("div",{onClick:e=>{e.preventDefault(),e.stopPropagation(),eT(t)},style:{display:"flex",alignItems:"center",gap:"6px",padding:"6px 10px",background:r?"#dbeafe":"#fff",border:`2px solid ${r?"#3b82f6":"#e5e7eb"}`,borderRadius:"20px",cursor:"pointer",fontSize:"13px",transition:"all 0.2s ease",userSelect:"none"},children:[i.jsx("span",{style:{width:"24px",height:"24px",borderRadius:"50%",background:r?"#3b82f6":"#e5e7eb",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"600"},children:(e.name||e.email||"?").charAt(0).toUpperCase()}),e.name||e.email,r&&i.jsx(h.Z,{style:{width:"14px",height:"14px",color:"#3b82f6"}})]},t)})}):i.jsx("p",{style:{fontSize:"13px",color:"#6b7280",fontStyle:"italic"},children:"No attendees in original meeting"})})()]}),(0,i.jsxs)("div",{style:{marginBottom:"20px"},children:[i.jsx("label",{style:{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.05em"},children:"Agenda"}),(0,i.jsxs)("div",{style:{display:"flex",gap:"8px",marginBottom:"10px"},children:[i.jsx("input",{type:"text",value:ex,onChange:e=>ef(e.target.value),placeholder:"Add agenda item...",onKeyPress:e=>"Enter"===e.key&&(e.preventDefault(),eB()),style:{flex:1,padding:"12px 14px",border:"1px solid #E5E7EB",borderRadius:"10px",fontSize:"14px",outline:"none",background:"#F9FAFB",transition:"border-color 0.2s, box-shadow 0.2s"},onFocus:e=>{e.currentTarget.style.borderColor="#3B82F6",e.currentTarget.style.boxShadow="0 0 0 3px rgba(59, 130, 246, 0.1)"},onBlur:e=>{e.currentTarget.style.borderColor="#E5E7EB",e.currentTarget.style.boxShadow="none"}}),i.jsx("button",{type:"button",onClick:eB,style:{padding:"12px 20px",background:"#1F2937",color:"#fff",border:"none",borderRadius:"10px",fontSize:"13px",fontWeight:"600",cursor:"pointer",transition:"background 0.2s"},onMouseEnter:e=>e.currentTarget.style.background="#374151",onMouseLeave:e=>e.currentTarget.style.background="#1F2937",children:"Add"})]}),ec.agenda_items.length>0&&i.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:ec.agenda_items.map((e,t)=>(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"#f3f4f6",borderRadius:"6px",fontSize:"13px"},children:[(0,i.jsxs)("span",{children:[t+1,". ",e]}),i.jsx("button",{type:"button",onClick:()=>eM(t),style:{background:"none",border:"none",color:"#ef4444",cursor:"pointer",padding:"4px"},children:i.jsx(f.Z,{style:{width:"16px",height:"16px"}})})]},t))})]}),(0,i.jsxs)("div",{style:{marginBottom:"24px"},children:[i.jsx("label",{style:{display:"block",fontSize:"12px",fontWeight:"600",color:"#6B7280",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.05em"},children:"Notes"}),i.jsx("textarea",{value:ec.notes,onChange:e=>eg(t=>({...t,notes:e.target.value})),placeholder:"Additional context for this follow-up...",rows:2,style:{width:"100%",padding:"12px 14px",border:"1px solid #E5E7EB",borderRadius:"10px",fontSize:"14px",outline:"none",resize:"none",background:"#F9FAFB",transition:"border-color 0.2s, box-shadow 0.2s"},onFocus:e=>{e.currentTarget.style.borderColor="#3B82F6",e.currentTarget.style.boxShadow="0 0 0 3px rgba(59, 130, 246, 0.1)"},onBlur:e=>{e.currentTarget.style.borderColor="#E5E7EB",e.currentTarget.style.boxShadow="none"}})]}),(0,i.jsxs)("div",{style:{display:"flex",gap:"12px",paddingTop:"16px",borderTop:"1px solid #E5E7EB"},children:[i.jsx("button",{type:"button",onClick:()=>ed(!1),style:{padding:"14px 24px",background:"#F3F4F6",color:"#374151",border:"none",borderRadius:"12px",fontSize:"14px",fontWeight:"600",cursor:"pointer",transition:"background 0.2s"},onMouseEnter:e=>e.currentTarget.style.background="#E5E7EB",onMouseLeave:e=>e.currentTarget.style.background="#F3F4F6",children:"Cancel"}),i.jsx("button",{type:"submit",disabled:eh,style:{flex:1,padding:"14px 24px",background:eh?"#9CA3AF":"#1F2937",color:"#fff",border:"none",borderRadius:"12px",fontSize:"14px",fontWeight:"600",cursor:eh?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",transition:"background 0.2s"},onMouseEnter:e=>!eh&&(e.currentTarget.style.background="#374151"),onMouseLeave:e=>!eh&&(e.currentTarget.style.background="#1F2937"),children:eh?(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)("svg",{className:"animate-spin",style:{width:"16px",height:"16px"},fill:"none",viewBox:"0 0 24 24",children:[i.jsx("circle",{cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4",style:{opacity:.25}}),i.jsx("path",{fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z",style:{opacity:.75}})]}),"Creating..."]}):"Schedule Follow-up"})]})]})]})})]}):null}},21702:(e,t,r)=>{"use strict";r.r(t),r.d(t,{$$typeof:()=>o,__esModule:()=>a,default:()=>l});var i=r(95153);let n=(0,i.createProxy)(String.raw`/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/timetable/page.tsx`),{__esModule:a,$$typeof:o}=n,s=n.default,l=s}};var t=require("../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),i=t.X(0,[3271,2977,1323,7490,6512,7609,7068,1111],()=>r(60914));module.exports=i})();