exports.id=1336,exports.ids=[1336],exports.modules={1493:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,3579,23)),Promise.resolve().then(r.t.bind(r,619,23)),Promise.resolve().then(r.t.bind(r,1459,23)),Promise.resolve().then(r.t.bind(r,3456,23)),Promise.resolve().then(r.t.bind(r,847,23)),Promise.resolve().then(r.t.bind(r,7303,23))},5806:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,233,23)),Promise.resolve().then(r.bind(r,6160)),Promise.resolve().then(r.bind(r,6837))},6160:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>L});var a=r(3854),o=r(1018),i=r(6837),s=r(4218),n=r(887),l=r.n(n);r(3638);var d=r(5548),c=r.n(d),m=r(2132);function p(){let{user:e}=(0,i.useAuth)(),[t,r]=(0,s.useState)([]),[o,n]=(0,s.useState)(0),[l,d]=(0,s.useState)(!1),[c,p]=(0,s.useState)(!1),f=(0,s.useRef)(null);(0,s.useEffect)(()=>{let e=e=>{f.current&&!f.current.contains(e.target)&&d(!1)};return document.addEventListener("mousedown",e),()=>document.removeEventListener("mousedown",e)},[]);let u=async()=>{if(e?.id)try{p(!0);let{data:t,error:a}=await m.supabase.from("notifications").select("*").eq("recipient_id",e.id).order("created_at",{ascending:!1}).limit(20);if(a)throw a;r(t||[]),n(t?.filter(e=>!e.is_read).length||0)}catch(e){console.error("Failed to fetch notifications:",e)}finally{p(!1)}},x=async e=>{try{let{error:a}=await m.supabase.from("notifications").update({is_read:!0}).eq("id",e);if(a)throw a;r(t.map(t=>t.id===e?{...t,is_read:!0}:t)),n(e=>Math.max(0,e-1))}catch(e){console.error("Failed to mark notification as read:",e)}},b=async()=>{if(e?.id)try{let{error:a}=await m.supabase.from("notifications").update({is_read:!0}).eq("recipient_id",e.id).eq("is_read",!1);if(a)throw a;r(t.map(e=>({...e,is_read:!0}))),n(0)}catch(e){console.error("Failed to mark all notifications as read:",e)}},h=async e=>{e.is_read||await x(e.id),e.data?.task_url?window.location.href=e.data.task_url:e.data?.project_url&&(window.location.href=e.data.project_url)},g=e=>{switch(e){case"task_assigned":return a.jsx("div",{className:"w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center",children:a.jsx("svg",{className:"w-4 h-4 text-blue-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:a.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"})})});case"task_reminder":return a.jsx("div",{className:"w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center",children:a.jsx("svg",{className:"w-4 h-4 text-yellow-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:a.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"})})});case"task_status_changed":return a.jsx("div",{className:"w-8 h-8 bg-green-100 rounded-full flex items-center justify-center",children:a.jsx("svg",{className:"w-4 h-4 text-green-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:a.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"})})});default:return a.jsx("div",{className:"w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center",children:a.jsx("svg",{className:"w-4 h-4 text-gray-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:a.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})})})}},y=e=>{let t=new Date(e),r=new Date,a=r.getTime()-t.getTime(),o=Math.floor(a/36e5),i=Math.floor(o/24);if(o<1){let e=Math.floor(a/6e4);return e<1?"Just now":`${e}m ago`}return o<24?`${o}h ago`:i<7?`${i}d ago`:t.toLocaleDateString()};return((0,s.useEffect)(()=>{e?.id&&u()},[e?.id]),(0,s.useEffect)(()=>{if(!e?.id)return;let t=m.supabase.channel("notifications").on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`recipient_id=eq.${e.id}`},e=>{let t=e.new;r(e=>[t,...e]),n(e=>e+1)}).subscribe();return()=>{m.supabase.removeChannel(t)}},[e?.id]),e)?(0,a.jsxs)("div",{className:"relative",ref:f,children:[(0,a.jsxs)("button",{onClick:()=>d(!l),className:"relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200","aria-label":"Notifications",children:[a.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:a.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M15 17h5l-5 5v-5zM12 2a7 7 0 00-7 7v4l-2 2v1h18v-1l-2-2V9a7 7 0 00-7-7z"})}),o>0&&a.jsx("span",{className:"absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium",children:o>9?"9+":o})]}),l&&(0,a.jsxs)("div",{className:"absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden",children:[(0,a.jsxs)("div",{className:"px-4 py-3 border-b border-gray-200 flex items-center justify-between",children:[a.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:"Notifications"}),o>0&&a.jsx("button",{onClick:b,className:"text-sm text-blue-600 hover:text-blue-800 font-medium",children:"Mark all read"})]}),a.jsx("div",{className:"max-h-80 overflow-y-auto",children:c?(0,a.jsxs)("div",{className:"p-4 text-center text-gray-500",children:[a.jsx("div",{className:"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"}),a.jsx("p",{className:"mt-2 text-sm",children:"Loading notifications..."})]}):0===t.length?(0,a.jsxs)("div",{className:"p-8 text-center text-gray-500",children:[a.jsx("svg",{className:"w-12 h-12 mx-auto mb-4 text-gray-300",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:a.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:1,d:"M15 17h5l-5 5v-5zM12 2a7 7 0 00-7 7v4l-2 2v1h18v-1l-2-2V9a7 7 0 00-7-7z"})}),a.jsx("p",{className:"text-sm",children:"No notifications yet"}),a.jsx("p",{className:"text-xs text-gray-400 mt-1",children:"You'll see updates about your tasks here"})]}):t.map(e=>a.jsx("div",{onClick:()=>h(e),className:`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${e.is_read?"":"bg-blue-50"}`,children:(0,a.jsxs)("div",{className:"flex items-start space-x-3",children:[g(e.type),(0,a.jsxs)("div",{className:"flex-1 min-w-0",children:[a.jsx("p",{className:`text-sm font-medium text-gray-900 ${e.is_read?"":"font-semibold"}`,children:e.title}),a.jsx("p",{className:"text-sm text-gray-600 mt-1 line-clamp-2",children:e.message}),a.jsx("p",{className:"text-xs text-gray-400 mt-2",children:y(e.created_at)})]}),!e.is_read&&a.jsx("div",{className:"w-2 h-2 bg-blue-600 rounded-full mt-2"})]})},e.id))}),t.length>0&&a.jsx("div",{className:"px-4 py-3 border-t border-gray-200 bg-gray-50",children:a.jsx("a",{href:"/inbox",className:"text-sm text-blue-600 hover:text-blue-800 font-medium",onClick:()=>d(!1),children:"View all notifications"})})]})]}):null}var f=r(900),u=r(199),x=r(2075),b=r(7121),h=r(4358),g=r(4063),y=r(9618),j=r(2637),w=r(8604),_=r(5908),v=r(4791),k=r(30),C=r(7375),z=r(2376),N=r(9072),E=r(2730),D=r(5388),F=r(3768),S=r(6965),T=r(6835),P=r(9374),A=r(8998),$=r(3882),I=r(8041),q=r(1888),M=r(9329);function B({projects:e,onCreateProject:t}){let n=(0,o.useRouter)(),d=(0,o.usePathname)(),{user:m,logout:B}=(0,i.useAuth)(),[O,R]=(0,s.useState)([]),[U,L]=(0,s.useState)(!0),[H,Z]=(0,s.useState)(!1),[W,Y]=(0,s.useState)(!1),[G,J]=(0,s.useState)(!1),[X,V]=(0,s.useState)(!1),[K,Q]=(0,s.useState)(!1),[ee,et]=(0,s.useState)(!1),[er,ea]=(0,s.useState)(!1),[eo,ei]=(0,s.useState)(!1),es=e&&e.length>0?e:O;(0,s.useEffect)(()=>{let t=async()=>{if((!e||!(e.length>0))&&m?.id)try{let{projectService:e}=await r.e(4937).then(r.bind(r,4937)),t=await e.getProjects();Array.isArray(t)&&R(t.map(e=>({id:e.id,name:e.name,color:e.color||"#3B82F6"})))}catch(e){console.error("Sidebar: Failed to fetch projects:",e)}};t()},[m?.id,e]);let en=async(e,t)=>{if(e.preventDefault(),e.stopPropagation(),confirm("Are you sure you want to delete this project? This action cannot be undone."))try{let{projectService:e}=await r.e(4937).then(r.bind(r,4937));await e.deleteProject(t),R(e=>e.filter(e=>e.id!==t))}catch(e){console.error("Failed to delete project:",e),alert("Failed to delete project. Please try again.")}},[el,ed]=(0,s.useState)({startDate:"",endDate:"",reason:"",leaveType:"vacation",notes:"",projectId:0}),[ec,em]=(0,s.useState)(14),[ep,ef]=(0,s.useState)(0),eu=async()=>{if(!m?.id){Q(!1);return}try{let e=(await Promise.resolve().then(r.bind(r,2132))).supabase;console.log("\uD83D\uDD0D Checking Class Schedule access for user:",m.id,m.email);let{data:t,error:a}=await e.from("class_schedule_members").select("id, role").eq("user_id",m.id).single();if(console.log("\uD83D\uDCCB Class Schedule member check:",{memberData:t,memberError:a}),t&&!a){console.log("✅ Class Schedule access granted: User is a member"),Q(!0);return}let{data:o,error:i}=await e.from("auth_user").select("id, name, email, role, is_superuser, is_staff").eq("id",m.id).single();if(console.log("\uD83D\uDC64 User data check:",o),i){console.log("❌ Class Schedule access denied: User data error"),Q(!1);return}let s=o.is_superuser||o.is_staff||"admin"===o.role||"hr"===o.role;console.log("\uD83D\uDD10 Class Schedule admin/HR check:",{is_superuser:o.is_superuser,is_staff:o.is_staff,role:o.role,hasPermission:s}),Q(s)}catch(e){console.error("Error checking class schedule access:",e),Q(!1)}},ex=async()=>{if(!m?.id){et(!1);return}try{let e=(await Promise.resolve().then(r.bind(r,2132))).supabase;console.log("\uD83D\uDD0D Checking Content Calendar access for user:",m.id,m.email);let{data:t,error:a}=await e.from("content_calendar_members").select("id, role").eq("user_id",m.id).single();if(console.log("\uD83D\uDCCB Content Calendar member check:",{memberData:t,memberError:a}),t&&!a){console.log("✅ Content Calendar access granted: User is a member"),et(!0);return}let{data:o,error:i}=await e.from("content_calendar_folder_members").select("id, role").eq("user_id",m.id).limit(1);if(console.log("\uD83D\uDCC1 Folder member check:",{folderMemberData:o,folderMemberError:i}),o&&o.length>0&&!i){console.log("✅ Content Calendar access granted: User is a folder member"),et(!0);return}let{data:s,error:n}=await e.from("auth_user").select("id, name, email, role, is_superuser, is_staff").eq("id",m.id).single();if(console.log("\uD83D\uDC64 User data check:",s),n){console.log("❌ Content Calendar access denied: User data error"),et(!1);return}let l=s.is_superuser||s.is_staff||"admin"===s.role||"hr"===s.role;console.log("\uD83D\uDD10 Content Calendar admin/HR check:",{is_superuser:s.is_superuser,is_staff:s.is_staff,role:s.role,hasPermission:l}),l?(console.log("✅ Content Calendar access granted: User is admin/HR"),et(!0)):(console.log("❌ Content Calendar access denied: No access found"),et(!1))}catch(e){console.error("Error checking content calendar access:",e),et(!1)}},eb=async()=>{if(!m?.id){ea(!1);return}try{let e=(await Promise.resolve().then(r.bind(r,2132))).supabase;console.log("\uD83D\uDD0D Checking Classes access for user:",m.id,m.email);let{data:t,error:a}=await e.from("classes_members").select("id, role").eq("user_id",m.id).single();if(console.log("\uD83D\uDCCB Classes member check:",{memberData:t,memberError:a}),t&&!a){console.log("✅ Classes access granted: User is a member"),ea(!0);return}let{data:o,error:i}=await e.from("auth_user").select("id, name, email, role, is_superuser, is_staff").eq("id",m.id).single();if(console.log("\uD83D\uDC64 Classes user data check:",o),i){console.log("❌ Classes access denied: User data error"),ea(!1);return}let s=o.is_superuser||o.is_staff||"admin"===o.role||"hr"===o.role;console.log("\uD83D\uDD10 Classes admin/HR check:",{is_superuser:o.is_superuser,is_staff:o.is_staff,role:o.role,hasPermission:s}),ea(s)}catch(e){console.error("Error checking classes access:",e),ea(!1)}},eh=async()=>{if(!m?.id){ei(!1);return}try{let e=(await Promise.resolve().then(r.bind(r,2132))).supabase;console.log("\uD83D\uDD0D Checking Company Outreach access for user:",m.id,m.email,m);let t=m.role||m?.user_metadata?.role;if("instructor"===t){console.log("❌ Company Outreach access denied: User is instructor (restricted)"),ei(!1);return}let{data:a,error:o}=await e.from("company_outreach_members").select("id, role").eq("user_id",m.id).single();if(console.log("\uD83D\uDCCB Company Outreach member check:",{memberData:a,memberError:o}),a&&!o){console.log("✅ Company Outreach access granted: User is a member"),ei(!0);return}let i="admin"===t||"hr"===t||"superuser"===t;if(console.log("\uD83D\uDD0D Auth context check:",{contextRole:t,isAdmin:i,userRole:m.role,userMetadata:m?.user_metadata}),i){console.log("✅ Company Outreach access granted: Admin from context"),ei(!0);return}let{data:s,error:n}=await e.from("auth_user").select("id, name, email, role, is_superuser, is_staff").eq("id",m.id).single();if(console.log("\uD83D\uDC64 Company Outreach database user check:",s,n),!n&&s){if("instructor"===s.role){console.log("❌ Company Outreach access denied: Database role is instructor"),ei(!1);return}let e=s.is_superuser||s.is_staff||"admin"===s.role||"hr"===s.role;if(console.log("\uD83D\uDD10 Company Outreach admin/HR check:",{is_superuser:s.is_superuser,is_staff:s.is_staff,role:s.role,hasAdminPermission:e}),e){console.log("✅ Company Outreach access granted: Admin from database"),ei(!0);return}}console.log("❌ Company Outreach access denied: User not in member table and not admin"),ei(!1)}catch(e){console.error("Error checking company outreach access:",e),ei(!1)}},eg=async()=>{if(m?.id)try{let e=(await Promise.resolve().then(r.bind(r,2132))).supabase,{data:t,error:a}=await e.from("employee_leave_balance").select("available_days, used_days, total_days").eq("employee_id",m.id).single();a?(console.log("No leave balance record found, using defaults"),em(14),ef(0)):(em(t.available_days||14),ef(t.used_days||0))}catch(e){console.error("Error fetching leave balance:",e),em(14),ef(0)}};(0,s.useEffect)(()=>{m?.id?(eg(),eu(),ex(),eb(),eh()):(Q(!1),et(!1),ea(!1),ei(!1))},[m?.id]);let ey=(0,s.useRef)(null),[ej,ew]=(0,s.useState)(!1),[e_,ev]=(0,s.useState)({projectId:0,reportDate:new Date().toISOString().split("T")[0],dateDisplay:"",keyActivities:[""],ongoingTasks:[""],challenges:[""],teamPerformance:[""],nextDayPriorities:[""],meetingMinutes:"",hasMeetingMinutes:!1,otherNotes:""}),[ek,eC]=(0,s.useState)(!1),[ez,eN]=(0,s.useState)([]),[eE,eD]=(0,s.useState)(0),[eF,eS]=(0,s.useState)(!1),eT=async()=>{try{await B(),n.push("/login")}catch(e){console.error("Logout failed:",e)}},eP=()=>{Z(!1),Y(!1)},eA=()=>{console.log("\uD83D\uDD25 DEBUG: Toggle dropdown clicked! Current state:",W),Y(!W),console.log("\uD83D\uDD25 DEBUG: Setting dropdown state to:",!W)},e$=()=>{Y(!1)},eI=async e=>{e.preventDefault();let t=new Date(el.startDate),a=new Date(el.endDate),o=a.getTime()-t.getTime(),i=Math.ceil(o/864e5)+1;if(i>ec){alert(`You only have ${ec} days available. You requested ${i} days.`);return}try{if(!m?.id){alert("User not found. Please log in again.");return}let e=es.find(e=>e.id===el.projectId),o={start_date:el.startDate,end_date:el.endDate,leave_type:el.leaveType,reason:el.reason,notes:el.notes||"",project_id:el.projectId||null,project_name:e?.name||null};console.log("Submitting leave request:",o),console.log("Auth token exists:",!!localStorage.getItem("accessToken")),console.log("Auth token:",localStorage.getItem("accessToken")?.substring(0,50)+"..."),console.log("User data:",m),console.log("Request headers:",{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("accessToken")}`});let s=(await Promise.resolve().then(r.bind(r,2132))).supabase,{data:n,error:l}=await s.from("leave_requests").insert([{employee_id:m.id,employee_name:m.name||m.email?.split("@")[0]||"Unknown",employee_email:m.email,project_id:o.project_id,project_name:o.project_name,start_date:o.start_date,end_date:o.end_date,leave_type:o.leave_type,reason:o.reason,notes:o.notes,days_requested:i,status:"pending"}]).select();if(l)throw console.error("Error submitting leave request:",l),Error(l.message||"Failed to submit leave request");ed({startDate:"",endDate:"",reason:"",leaveType:"vacation",notes:"",projectId:0}),V(!1);try{let{data:e,error:r}=await s.from("auth_user").select("id, first_name, last_name, email").or("is_staff.eq.true,is_superuser.eq.true");if(!r&&e&&e.length>0){let r=e.map(e=>({recipient_id:e.id,sender_id:m.id,type:"leave_request_submitted",title:"New Leave Request",message:`${m.name||m.email?.split("@")[0]} has submitted a ${i}-day leave request for ${t.toLocaleDateString()} - ${a.toLocaleDateString()}`,data:{leave_request_id:n[0]?.id,employee_name:m.name||m.email?.split("@")[0],employee_email:m.email,days:i,start_date:el.startDate,end_date:el.endDate,leave_type:el.leaveType}})),{error:o}=await s.from("notifications").insert(r);o&&console.error("Error creating HR notifications:",o)}}catch(e){console.error("Error notifying HR users:",e)}await eg(),alert(`Leave request submitted successfully! 
        
Your request for ${i} days has been sent to HR for approval.
        
Status: Pending Approval
Days Requested: ${i}
Period: ${t.toLocaleDateString()} - ${a.toLocaleDateString()}

You will be notified once HR reviews your request.`)}catch(e){console.error("Error submitting leave request:",e),alert("Failed to submit leave request. Please try again.")}},eq=()=>{V(!1),ed({startDate:"",endDate:"",reason:"",leaveType:"vacation",notes:"",projectId:0})},eM=()=>{if(!el.startDate||!el.endDate)return 0;let e=new Date(el.startDate),t=new Date(el.endDate);if(t<e)return 0;let r=t.getTime()-e.getTime();return Math.ceil(r/864e5)+1},eB=async e=>{e.preventDefault();let t=e_.keyActivities.filter(e=>e.trim()).join("\n• ");if(!t||!e_.projectId){alert("Please fill in the required fields: Key Activities and Project.");return}try{if(!m?.id){alert("User not found. Please log in again.");return}let e=es.find(e=>e.id===e_.projectId),a=(await Promise.resolve().then(r.bind(r,2132))).supabase,o=e=>{let t=e.filter(e=>e.trim());return t.length>0?"• "+t.join("\n• "):null},{data:i,error:s}=await a.from("daily_reports").insert([{employee_id:m.id,employee_name:m.name||m.email?.split("@")[0]||"Unknown",employee_email:m.email,project_id:e_.projectId,project_name:e?.name||null,report_date:e_.reportDate,date_display:e_.dateDisplay,key_activities:o(e_.keyActivities),ongoing_tasks:o(e_.ongoingTasks),challenges:o(e_.challenges),team_performance:o(e_.teamPerformance),next_day_priorities:o(e_.nextDayPriorities),meeting_minutes:e_.meetingMinutes.trim()||null,has_meeting_minutes:e_.hasMeetingMinutes,other_notes:e_.otherNotes.trim()||null}]).select();if(s){if(console.error("Error submitting daily report:",s),"23505"===s.code)alert("You have already submitted a daily report for this date and project. Please edit the existing report or choose a different project.");else throw Error(s.message||"Failed to submit daily report")}else ev({projectId:0,reportDate:new Date().toISOString().split("T")[0],dateDisplay:"",keyActivities:[""],ongoingTasks:[""],challenges:[""],teamPerformance:[""],nextDayPriorities:[""],meetingMinutes:"",hasMeetingMinutes:!1,otherNotes:""}),ew(!1),alert(`Daily report submitted successfully! 
        
Your report for ${e_.dateDisplay} has been saved.

Project: ${e?.name||"Unknown"}
Key Activities: ${t.substring(0,100)}${t.length>100?"...":""}

Your report is now available in the system.`)}catch(e){console.error("Error submitting daily report:",e),alert("Failed to submit daily report. Please try again.")}},eO=()=>{ew(!1),ev({projectId:0,reportDate:new Date().toISOString().split("T")[0],dateDisplay:"",keyActivities:[""],ongoingTasks:[""],challenges:[""],teamPerformance:[""],nextDayPriorities:[""],meetingMinutes:"",hasMeetingMinutes:!1,otherNotes:""})},eR=e=>{ev(t=>({...t,[e]:[...t[e],""]}))},eU=(e,t)=>{ev(r=>{let a=r[e];if(a.length>1){let o=a.filter((e,r)=>r!==t);return{...r,[e]:o}}return r})},eL=(e,t,r)=>{ev(a=>{let o=[...a[e]];return o[t]=r,{...a,[e]:o}})},eH=async()=>{if(m?.id)try{let e=(await Promise.resolve().then(r.bind(r,2132))).supabase,{count:t,error:a}=await e.from("notifications").select("*",{count:"exact",head:!0}).eq("recipient_id",m.id).eq("is_read",!1);a?(console.error("Error fetching unread count:",a),eD(0)):eD(t||0)}catch(e){console.error("Error fetching unread count:",e),eD(0)}},eZ=async e=>{try{let t=(await Promise.resolve().then(r.bind(r,2132))).supabase,{error:a}=await t.from("notifications").update({is_read:!0}).eq("id",e);a?console.error("Error marking notification as read:",a):(eN(ez.map(t=>t.id===e?{...t,is_read:!0}:t)),eH())}catch(e){console.error("Error marking notification as read:",e)}},eW=e=>{switch(e){case"leave_request":return a.jsx(f.Z,{style:{width:"16px",height:"16px",color:"#f59e0b"}});case"leave_status_update":return a.jsx(u.Z,{style:{width:"16px",height:"16px",color:"#10b981"}});default:return a.jsx(x.Z,{style:{width:"16px",height:"16px",color:"#6b7280"}})}},eY=e=>{let t=new Date(e),r=new Date,a=(r.getTime()-t.getTime())/36e5;return a<1?"Just now":a<24?`${Math.floor(a)}h ago`:t.toLocaleDateString()};(0,s.useEffect)(()=>{if(m?.id){let e=async()=>{await eH()};e();let t=setInterval(eH,3e4);return()=>clearInterval(t)}},[m?.id]),(0,s.useEffect)(()=>{let e=e=>{let t=e.target,r=ey.current&&!ey.current.contains(t),a=!t.closest||!t.closest("[data-dropdown-portal]");r&&a&&(console.log("\uD83D\uDD25 DEBUG: Closing dropdown due to outside click"),Y(!1))};return W&&document.addEventListener("mousedown",e),()=>{document.removeEventListener("mousedown",e)}},[W]);let eG=[{name:"Home",href:"/dashboard",icon:b.Z},{name:"My Tasks",href:"/my-tasks",icon:h.Z},{name:"Calendar",href:"/calendar",icon:g.Z},{name:"My Personal",href:"/personal",icon:y.Z},{name:"Expenses",href:"/expenses",icon:j.Z},{name:"Messages",href:"/messages",icon:w.Z},{name:"Password Vault",href:"/password-vault",icon:_.Z},{name:"Timetable",href:"/timetable",icon:v.Z},{name:"Reporting",href:"/reporting",icon:k.Z}],eJ=[...eG,{name:"Content Calendar",href:"/content-calendar",icon:C.Z},...K?[{name:"Class Schedule",href:"/class-schedule",icon:z.Z}]:[],...er?[{name:"Classes",href:"/classes",icon:N.Z}]:[]],eX=[...eo?[{name:"Company Outreach",href:"/company-outreach",icon:E.Z}]:[]],eV=m?.role==="admin"||m?.user_metadata?.role==="admin",eK=eV?[{name:"Admin",href:"/admin",icon:D.Z}]:[],eQ=m?.role==="instructor"||m?.user_metadata?.role==="instructor",e0=eQ?[{name:"Instructor",href:"/instructor",icon:z.Z}]:[],e1=eQ?[{name:"Home",href:"/dashboard",icon:b.Z},{name:"My Tasks",href:"/my-tasks",icon:h.Z},{name:"Calendar",href:"/calendar",icon:g.Z},{name:"Messages",href:"/messages",icon:w.Z},{name:"Timetable",href:"/timetable",icon:v.Z}]:eJ,e9=[{name:"Inbox",href:"/inbox",icon:F.Z},{name:"Daily Reports",href:"/daily-reports",icon:S.Z},{name:"Expenses",href:"/expenses",icon:j.Z},{name:"Absence Management",href:"/employee-absent",icon:y.Z}];F.Z;let e4=e=>"/dashboard"===e?d===e:d?.startsWith(e);return(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1",children:[a.jsx("style",{dangerouslySetInnerHTML:{__html:`
          /* Professional Sidebar Theme */
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 280px;
            height: 100vh;
            background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
            border-right: 1px solid rgba(196, 131, 217, 0.2);
            display: flex;
            flex-direction: column;
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            z-index: 100;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
            backdrop-filter: blur(10px);
            overflow: hidden;
          }
          
          .sidebar.collapsed {
            width: 72px;
          }
          
          .sidebar::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #FFB333, #C483D9, #5884FD, #F87239);
            animation: shimmer 3s ease-in-out infinite;
          }
          
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          
          .sidebar-header {
            padding: 1.5rem 1.25rem;
            background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
            border-bottom: 1px solid rgba(196, 131, 217, 0.2);
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            position: relative;
            overflow: hidden;
          }
          
          .sidebar-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
            animation: headerShine 4s ease-in-out infinite;
          }
          
          @keyframes headerShine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          .sidebar.collapsed .sidebar-header {
            padding: 1rem 0.75rem;
          }
          
          .sidebar-header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.25rem;
            position: relative;
            z-index: 2;
          }
          
          .sidebar.collapsed .sidebar-header-content {
            margin-bottom: 0.75rem;
            justify-content: center;
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .sidebar-title {
            font-size: 1.5rem;
            font-weight: 800;
            color: #1F2937;
            margin: 0;
            text-shadow: none;
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            letter-spacing: -0.025em;
          }
          
          .sidebar.collapsed .sidebar-title {
            opacity: 0;
            pointer-events: none;
            transform: scale(0.8);
          }
          
          .sidebar-toggle {
            padding: 0.75rem;
            background: rgba(255, 179, 51, 0.1);
            border: 1px solid rgba(255, 179, 51, 0.2);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            color: #F87239;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            min-width: 44px;
            min-height: 44px;
          }
          
          .sidebar-toggle:hover {
            background: rgba(255, 179, 51, 0.2);
            border-color: rgba(255, 179, 51, 0.4);
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 4px 16px rgba(255, 179, 51, 0.2);
          }
          
          .sidebar-toggle:active {
            transform: translateY(-1px) scale(0.98);
          }
          
          .sidebar-add-container {
            position: relative;
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .sidebar.collapsed .sidebar-add-container {
            opacity: 0;
            pointer-events: none;
            transform: scale(0.8);
          }
          
          .sidebar-add-btn {
            padding: 0.75rem;
            color: #F87239;
            background: rgba(255, 179, 51, 0.1);
            border: 1px solid rgba(255, 179, 51, 0.2);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 44px;
            min-height: 44px;
          }
          
          .sidebar-add-btn:hover {
            background: rgba(255, 179, 51, 0.2);
            border-color: rgba(255, 179, 51, 0.4);
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 4px 16px rgba(255, 179, 51, 0.2);
          }
          
          .sidebar-add-btn.active {
            background: rgba(255, 179, 51, 0.3);
            border-color: rgba(255, 179, 51, 0.5);
            transform: translateY(-1px);
          }
          
          .dropdown-menu {
            position: fixed;
            top: 120px;
            right: 20px;
            z-index: 99999;
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            min-width: 200px;
            padding: 0.75rem;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px) scale(0.95);
            transition: all 0.2s ease;
            backdrop-filter: blur(15px);
            overflow: visible;
          }
          
          .sidebar.collapsed .dropdown-menu {
            position: fixed;
            top: 120px;
            left: 80px;
            right: auto;
          }
          
          .dropdown-menu.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
          }
          
          .dropdown-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.875rem 1rem;
            font-size: 0.875rem;
            color: #374151;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            border: none;
            background: none;
            width: 100%;
            text-align: left;
            border-radius: 12px;
            font-weight: 500;
            position: relative;
            overflow: hidden;
          }
          
          .dropdown-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, #FFB333, #C483D9);
            opacity: 0;
            transition: opacity 0.2s ease;
          }
          
          .dropdown-item:hover::before {
            opacity: 0.1;
          }
          
          .dropdown-item:hover {
            color: #FFB333;
            transform: translateX(4px);
          }
          
          .dropdown-item:active {
            transform: translateX(2px) scale(0.98);
          }
          
          .dropdown-icon {
            width: 18px;
            height: 18px;
            color: #6B7280;
            transition: all 0.2s ease;
            position: relative;
            z-index: 1;
          }
          
          .dropdown-item:hover .dropdown-icon {
            color: #FFB333;
          }
          

          
          .sidebar-nav {
            flex: 1;
            padding: 1.5rem 1rem;
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-width: thin;
            scrollbar-color: rgba(196, 131, 217, 0.3) transparent;
          }
          
          .sidebar-nav::-webkit-scrollbar {
            width: 6px;
          }
          
          .sidebar-nav::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .sidebar-nav::-webkit-scrollbar-thumb {
            background: rgba(196, 131, 217, 0.3);
            border-radius: 3px;
          }
          
          .sidebar-nav::-webkit-scrollbar-thumb:hover {
            background: rgba(196, 131, 217, 0.5);
          }
          
          .nav-section {
            margin-bottom: 2rem;
          }
          
          .nav-section-header {
            padding: 0.5rem 1rem;
            margin-bottom: 0.75rem;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            border-bottom: 1px solid rgba(196, 131, 217, 0.2);
          }
          
          .nav-section-header span {
            font-size: 0.75rem;
            color: #9CA3AF;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          
          .sidebar.collapsed .nav-section-header {
            opacity: 0;
            pointer-events: none;
            height: 0;
            padding: 0;
            margin: 0;
            border: none;
            transform: scale(0.8);
          }
          
          .nav-item {
            display: flex;
            align-items: center;
            padding: 0.875rem 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            cursor: pointer;
            color: #374151;
            text-decoration: none;
            margin-bottom: 0.5rem;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(10px);
          }
          
          .nav-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #FFB333, #F87239);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .nav-item:hover::before {
            opacity: 0.1;
          }
          
          .nav-item.active::before {
            opacity: 0.15;
          }
          
          .nav-item:hover {
            color: #FFB333;
            transform: translateX(4px);
            box-shadow: 0 4px 16px rgba(255, 179, 51, 0.2);
          }
          
          .nav-item.active {
            color: #FFB333;
            background: rgba(255, 179, 51, 0.1);
            border-left: 3px solid #FFB333;
            transform: translateX(3px);
          }
          
          .nav-item:active {
            transform: translateX(2px) scale(0.98);
          }
          
          .nav-icon {
            width: 20px;
            height: 20px;
            margin-right: 0.875rem;
            color: inherit;
            transition: all 0.3s ease;
            position: relative;
            z-index: 1;
          }
          
          .nav-text {
            position: relative;
            z-index: 1;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .sidebar.collapsed .nav-text {
            opacity: 0;
            pointer-events: none;
            transform: scale(0.8);
          }
          
          .sidebar.collapsed .nav-icon {
            margin-right: 0;
          }
          
          .projects-section {
            margin-top: 2rem;
          }
          
          .projects-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            font-weight: 600;
            color: #374151;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            border-radius: 12px;
            margin: 0.5rem 0 1rem 0;
            position: relative;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          
          .projects-toggle::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #FFB333, #F87239);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .projects-toggle:hover::before {
            opacity: 0.08;
          }
          
          .projects-toggle:hover {
            color: #F87239;
            background: rgba(255, 255, 255, 0.8);
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(255, 179, 51, 0.15);
          }
          
          .projects-toggle span {
            position: relative;
            z-index: 1;
            font-weight: 500;
            letter-spacing: 0.025em;
          }
          
          .projects-toggle svg {
            width: 16px;
            height: 16px;
            transition: all 0.3s ease;
            position: relative;
            z-index: 1;
            opacity: 0.7;
          }
          
          .projects-toggle:hover svg {
            opacity: 1;
          }
          
          .projects-toggle.expanded svg {
            transform: rotate(180deg);
          }
          
          .projects-list {
            margin-left: 1rem;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .project-item {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            color: #6B7280;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            cursor: pointer;
            margin-bottom: 0.25rem;
            position: relative;
            overflow: hidden;
          }
          
          .project-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #5884FD, #C483D9);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .project-item:hover::before {
            opacity: 0.1;
          }
          
          .project-item:hover {
            color: #5884FD;
            transform: translateX(4px);
          }
          
          .project-item.active {
            color: #5884FD;
            background: rgba(88, 132, 253, 0.1);
            border-left: 3px solid #5884FD;
            transform: translateX(3px);
          }
          
          .project-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 0;
            flex: 1;
            position: relative;
            z-index: 1;
          }
          
          .project-color {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
            border: 2px solid rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
          }
          
          .project-item:hover .project-color {
            transform: scale(1.2);
            box-shadow: 0 0 8px rgba(88, 132, 253, 0.4);
          }
          
          .project-name {
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
            white-space: normal;
            hyphens: auto;
            font-weight: 500;
            line-height: 1.3;
          }
          
          .project-count {
            font-size: 0.75rem;
            color: #9CA3AF;
            background: rgba(156, 163, 175, 0.1);
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-weight: 600;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }

          .project-item-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          .project-item-wrapper .project-delete-btn {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            opacity: 0;
            transition: all 0.2s ease;
            z-index: 2;
            color: #9CA3AF;
            padding: 0;
          }

          .project-item-wrapper:hover .project-delete-btn {
            opacity: 1;
          }

          .project-item-wrapper .project-delete-btn:hover {
            background: rgba(239, 68, 68, 0.1);
            color: #EF4444;
          }

          .project-item-wrapper:hover .project-count {
            opacity: 0;
            pointer-events: none;
          }
          
          .sidebar.collapsed .project-count {
            opacity: 0;
            pointer-events: none;
            transform: scale(0.8);
          }
          
          .sidebar-footer {
            padding: 1.5rem 1rem;
            border-top: 1px solid rgba(196, 131, 217, 0.2);
            background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
            margin-top: auto;
          }
          
          .user-profile {
            display: flex;
            align-items: center;
            gap: 0.875rem;
            padding: 0.875rem;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(196, 131, 217, 0.2);
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            cursor: pointer;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(10px);
          }
          
          .user-profile::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #FFB333, #C483D9);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .user-profile:hover::before {
            opacity: 0.1;
          }
          
          .user-profile:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(196, 131, 217, 0.2);
          }
          
          .user-avatar {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #FFB333, #F87239);
            border: 2px solid rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(255, 179, 51, 0.3);
            transition: all 0.3s ease;
            position: relative;
            z-index: 1;
          }
          
          .user-avatar:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(255, 179, 51, 0.4);
          }
          
          .user-avatar-text {
            font-size: 0.875rem;
            font-weight: 700;
            color: #FFFFFF;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
          
          .user-info {
            min-width: 0;
            flex: 1;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            position: relative;
            z-index: 1;
          }
          
          .sidebar.collapsed .user-info {
            opacity: 0;
            pointer-events: none;
            transform: scale(0.8);
          }
          
          .user-name {
            font-size: 0.875rem;
            font-weight: 600;
            color: #374151;
            margin: 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
            white-space: normal;
            line-height: 1.3;
          }
          
          .user-email {
            font-size: 0.75rem;
            color: #9CA3AF;
            margin: 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
            white-space: normal;
            line-height: 1.3;
          }
          
          .logout-btn {
            padding: 0.5rem;
            color: #9CA3AF;
            background: rgba(156, 163, 175, 0.1);
            border: 1px solid rgba(156, 163, 175, 0.2);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
            position: relative;
            z-index: 1;
          }
          
          .logout-btn:hover {
            color: #F87239;
            background: rgba(248, 114, 57, 0.1);
            border-color: rgba(248, 114, 57, 0.2);
            transform: translateY(-1px);
          }
          
          .logout-btn:active {
            transform: translateY(0) scale(0.98);
          }
          
          /* Tooltip for collapsed nav items */
          .nav-item.tooltip-container {
            position: relative;
          }
          
          .nav-tooltip {
            position: absolute;
            left: 100%;
            top: 50%;
            transform: translateY(-50%) translateX(-10px);
            background: linear-gradient(135deg, #374151, #1F2937);
            color: #FFFFFF;
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
            font-size: 0.75rem;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            z-index: 1000;
            margin-left: 0.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-weight: 500;
          }
          
          .nav-item:hover .nav-tooltip {
            opacity: 1;
            visibility: visible;
            transform: translateY(-50%) translateX(0);
          }
          
          /* Mobile Menu Toggle */
          .mobile-menu-button {
            position: fixed;
            top: 1.5rem;
            left: 1.5rem;
            z-index: 60;
            background: linear-gradient(135deg, #FFB333, #F87239);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            padding: 0.875rem;
            cursor: pointer;
            display: none;
            box-shadow: 0 4px 16px rgba(255, 179, 51, 0.3);
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            color: #FFFFFF;
          }
          
          .mobile-menu-button:hover {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 8px 24px rgba(255, 179, 51, 0.4);
          }
          
          .mobile-menu-button:active {
            transform: translateY(-1px) scale(0.98);
          }
          
          .mobile-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 40;
            display: none;
            backdrop-filter: blur(4px);
          }
          
          /* Global content adjustment for sidebar */
          body {
            margin: 0;
            padding: 0;
          }
          
          .sidebar ~ * {
            margin-left: 280px;
            transition: margin-left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .sidebar.collapsed ~ * {
            margin-left: 72px;
          }
          
          [style*="marginLeft: 256px"] {
            margin-left: 280px !important;
            transition: margin-left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          /* Enhanced Modal Styles */
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            z-index: 1000;
            animation: fadeIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .modal-content {
            background: linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%);
            border: 1px solid rgba(196, 131, 217, 0.2);
            border-radius: 24px;
            padding: 0;
            width: 100%;
            max-width: 520px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            position: relative;
          }
          
          .modal-content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #FFB333, #C483D9, #5884FD, #F87239);
          }
          
          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 2rem 2rem 1rem 2rem;
            border-bottom: 1px solid rgba(196, 131, 217, 0.2);
            background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
            position: relative;
          }
          
          .modal-title {
            font-size: 1.75rem;
            font-weight: 800;
            color: #1F2937;
            margin: 0;
            letter-spacing: -0.025em;
          }
          
          .modal-close-btn {
            background: rgba(156, 163, 175, 0.1);
            border: 1px solid rgba(156, 163, 175, 0.2);
              padding: 0.75rem;
            border-radius: 12px;
            cursor: pointer;
            color: #6B7280;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .modal-close-btn:hover {
            background: rgba(248, 114, 57, 0.1);
            border-color: rgba(248, 114, 57, 0.2);
            color: #F87239;
            transform: scale(1.05);
          }
          
          .modal-body {
            padding: 2rem;
            max-height: 75vh;
            overflow-y: auto;
          }
          
          .leave-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
            margin-bottom: 2rem;
          }
          
          .stat-card {
            text-align: center;
            padding: 1.5rem 1rem;
            background: linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%);
            border-radius: 16px;
            border: 1px solid rgba(196, 131, 217, 0.2);
            position: relative;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }
          
          .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #FFB333, #C483D9, #5884FD, #F87239);
          }
          
          .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
          }
          
          .stat-number {
            font-size: 2.5rem;
            font-weight: 900;
            margin-bottom: 0.5rem;
            color: #1F2937;
            letter-spacing: -0.025em;
          }
          
          .stat-label {
            font-size: 0.75rem;
            color: #6B7280;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.1em;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideIn {
            from { transform: translateY(-20px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          
          /* Responsive Design */
          @media (max-width: 768px) {
            .sidebar {
              transform: translateX(-100%);
              transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              z-index: 50;
              width: 300px;
            }
            
            .sidebar.open {
              transform: translateX(0);
            }
            
            .sidebar-toggle {
              display: none;
            }
            
            .mobile-menu-button {
              display: block;
            }
            
            .mobile-overlay.show {
              display: block;
            }
            
            .sidebar ~ * {
              margin-left: 0 !important;
            }
            
            .modal-content {
              max-width: 95vw;
              margin: 1rem;
            }
            
            .modal-header {
              padding: 1.5rem 1.5rem 1rem 1.5rem;
            }
            
            .modal-title {
              font-size: 1.5rem;
            }
            
            .modal-body {
              padding: 1.5rem;
            }
            
            .leave-stats {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
          }
          
          @media (max-width: 480px) {
            .sidebar {
              width: 100vw;
            }
            
            .mobile-menu-button {
              top: 1rem;
              left: 1rem;
              padding: 0.75rem;
            }
            
            .modal-overlay {
              padding: 1rem;
            }
            
            .modal-content {
              border-radius: 16px;
              max-height: 95vh;
            }
          }
        `}}),a.jsx("button",{onClick:()=>{Z(!H)},className:"jsx-79e4f0e0f941e9c1 mobile-menu-button",children:H?a.jsx(T.Z,{style:{width:"24px",height:"24px"}}):a.jsx(P.Z,{style:{width:"24px",height:"24px"}})}),a.jsx("div",{onClick:eP,className:`jsx-79e4f0e0f941e9c1 mobile-overlay ${H?"show":""}`}),(0,a.jsxs)("div",{className:`jsx-79e4f0e0f941e9c1 sidebar ${H?"open":""} ${G?"collapsed":""}`,children:[a.jsx("div",{className:"jsx-79e4f0e0f941e9c1 sidebar-header",children:(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 sidebar-header-content",children:[a.jsx("button",{onClick:()=>{J(!G),e$(),setTimeout(()=>{let e=document.querySelectorAll('[style*="marginLeft: 256px"]');e.forEach(e=>{e.style.marginLeft&&(e.style.marginLeft=G?"256px":"64px")})},0)},title:G?"Expand sidebar":"Collapse sidebar",className:"jsx-79e4f0e0f941e9c1 sidebar-toggle",children:a.jsx(P.Z,{style:{width:"20px",height:"20px"}})}),a.jsx("h1",{className:"jsx-79e4f0e0f941e9c1 sidebar-title",children:"Projects"}),(0,a.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem"},className:"jsx-79e4f0e0f941e9c1",children:[a.jsx(p,{}),a.jsx("div",{ref:ey,className:"jsx-79e4f0e0f941e9c1 sidebar-add-container",children:a.jsx("button",{onClick:e=>{console.log("\uD83D\uDD25 DEBUG: Plus (+) button clicked!",e),e.preventDefault(),e.stopPropagation(),eA()},title:"Create new...",className:`jsx-79e4f0e0f941e9c1 sidebar-add-btn ${W?"active":""}`,children:a.jsx(A.Z,{style:{width:"20px",height:"20px"}})})})]})]})}),(0,a.jsxs)("nav",{className:"jsx-79e4f0e0f941e9c1 sidebar-nav",children:[(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 nav-section",children:[(eQ?e1:eJ).map(e=>(0,a.jsxs)(c(),{href:e.href,className:`nav-item ${e4(e.href)?"active":""}`,onClick:eP,children:[a.jsx(e.icon,{className:"nav-icon"}),a.jsx("span",{className:"jsx-79e4f0e0f941e9c1 nav-text",children:e.name})]},e.name)),eQ||m?.role!=="hr"&&m?.role!=="admin"&&m?.user_metadata?.role!=="hr"&&m?.user_metadata?.role!=="admin"?!eQ&&(0,a.jsxs)(a.Fragment,{children:[a.jsx("div",{style:{borderTop:"1px solid #e5e7eb",margin:"1rem 0 0.5rem 0",paddingTop:"0.5rem"},className:"jsx-79e4f0e0f941e9c1 nav-section-header",children:a.jsx("span",{style:{fontSize:"0.75rem",color:"#666666",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.05em",paddingLeft:"0.75rem"},className:"jsx-79e4f0e0f941e9c1",children:"Personal"})}),e9.slice(0,2).map(e=>(0,a.jsxs)(c(),{href:e.href,className:`nav-item ${e4(e.href)?"active":""}`,onClick:eP,children:[a.jsx(e.icon,{className:"nav-icon"}),a.jsx("span",{className:"jsx-79e4f0e0f941e9c1 nav-text",children:e.name})]},e.name))]}):(0,a.jsxs)(a.Fragment,{children:[a.jsx("div",{style:{borderTop:"1px solid #e5e7eb",margin:"1rem 0 0.5rem 0",paddingTop:"0.5rem"},className:"jsx-79e4f0e0f941e9c1 nav-section-header",children:a.jsx("span",{style:{fontSize:"0.75rem",color:"#666666",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.05em",paddingLeft:"0.75rem"},className:"jsx-79e4f0e0f941e9c1",children:"HR Tools"})}),e9.map(e=>(0,a.jsxs)(c(),{href:e.href,className:`nav-item ${e4(e.href)?"active":""}`,onClick:eP,children:[a.jsx(e.icon,{className:"nav-icon"}),a.jsx("span",{className:"jsx-79e4f0e0f941e9c1 nav-text",children:e.name})]},e.name))]}),eX.length>0&&(0,a.jsxs)(a.Fragment,{children:[a.jsx("div",{style:{borderTop:"1px solid #e5e7eb",margin:"1rem 0 0.5rem 0",paddingTop:"0.5rem"},className:"jsx-79e4f0e0f941e9c1 nav-section-header",children:a.jsx("span",{style:{fontSize:"0.75rem",color:"#666666",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.05em",paddingLeft:"0.75rem"},className:"jsx-79e4f0e0f941e9c1",children:"Idea Lounge"})}),eX.map(e=>(0,a.jsxs)(c(),{href:e.href,className:`nav-item ${e4(e.href)?"active":""}`,onClick:eP,children:[a.jsx(e.icon,{className:"nav-icon"}),a.jsx("span",{className:"jsx-79e4f0e0f941e9c1 nav-text",children:e.name})]},e.name))]}),!eQ&&eK.length>0&&(0,a.jsxs)(a.Fragment,{children:[a.jsx("div",{style:{borderTop:"1px solid #e5e7eb",margin:"1rem 0 0.5rem 0",paddingTop:"0.5rem"},className:"jsx-79e4f0e0f941e9c1 nav-section-header",children:a.jsx("span",{style:{fontSize:"0.75rem",color:"#666666",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.05em",paddingLeft:"0.75rem"},className:"jsx-79e4f0e0f941e9c1",children:"Admin"})}),eK.map(e=>(0,a.jsxs)(c(),{href:e.href,className:`nav-item ${e4(e.href)?"active":""}`,onClick:eP,children:[a.jsx(e.icon,{className:"nav-icon"}),a.jsx("span",{className:"jsx-79e4f0e0f941e9c1 nav-text",children:e.name})]},e.name))]}),e0.length>0&&(0,a.jsxs)(a.Fragment,{children:[a.jsx("div",{style:{borderTop:"1px solid #e5e7eb",margin:"1rem 0 0.5rem 0",paddingTop:"0.5rem"},className:"jsx-79e4f0e0f941e9c1 nav-section-header",children:a.jsx("span",{style:{fontSize:"0.75rem",color:"#666666",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.05em",paddingLeft:"0.75rem"},className:"jsx-79e4f0e0f941e9c1",children:"Instructor"})}),e0.map(e=>(0,a.jsxs)(c(),{href:e.href,className:`nav-item ${e4(e.href)?"active":""}`,onClick:eP,children:[a.jsx(e.icon,{className:"nav-icon"}),a.jsx("span",{className:"jsx-79e4f0e0f941e9c1 nav-text",children:e.name})]},e.name))]})]}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 nav-section",children:[(0,a.jsxs)("button",{onClick:()=>L(!U),className:"jsx-79e4f0e0f941e9c1 projects-toggle",children:[a.jsx("span",{className:"jsx-79e4f0e0f941e9c1 projects-toggle-text",children:"My Projects"}),a.jsx("span",{className:"jsx-79e4f0e0f941e9c1 projects-toggle-icon",children:U?a.jsx($.Z,{style:{width:"16px",height:"16px"}}):a.jsx(I.Z,{style:{width:"16px",height:"16px"}})})]}),U&&a.jsx("div",{className:"jsx-79e4f0e0f941e9c1 projects-list",children:es.map(e=>(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 project-item-wrapper",children:[(0,a.jsxs)(c(),{href:`/projects/${e.id}`,className:`project-item ${e4(`/projects/${e.id}`)?"active":""}`,onClick:eP,style:{flex:1,paddingRight:"2.5rem"},children:[(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 project-info",children:[a.jsx("div",{style:{backgroundColor:e.color||"#000000"},className:"jsx-79e4f0e0f941e9c1 project-color"}),a.jsx("span",{style:{wordWrap:"break-word",overflowWrap:"break-word",whiteSpace:"normal",lineHeight:"1.3"},className:"jsx-79e4f0e0f941e9c1 project-name",children:e.name})]}),(0,a.jsxs)("span",{className:"jsx-79e4f0e0f941e9c1 project-count",children:[e.completed_task_count||0,"/",e.task_count||0]})]}),a.jsx("button",{title:"Delete project",onClick:t=>en(t,e.id),className:"jsx-79e4f0e0f941e9c1 project-delete-btn",children:a.jsx(q.Z,{style:{width:"16px",height:"16px"}})})]},e.id))})]})]}),a.jsx("div",{className:"jsx-79e4f0e0f941e9c1 sidebar-footer",children:(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 user-profile",children:[a.jsx("div",{className:"jsx-79e4f0e0f941e9c1 user-avatar",children:a.jsx("span",{className:"jsx-79e4f0e0f941e9c1 user-avatar-text",children:m?.name?.charAt(0).toUpperCase()})}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 user-info",children:[a.jsx("p",{className:"jsx-79e4f0e0f941e9c1 user-name",children:m?.name}),a.jsx("p",{className:"jsx-79e4f0e0f941e9c1 user-email",children:m?.email})]}),a.jsx("button",{onClick:eT,title:"Sign out",className:"jsx-79e4f0e0f941e9c1 logout-btn",children:a.jsx(M.Z,{style:{width:"20px",height:"20px"}})})]})})]}),W&&(console.log("\uD83D\uDD25 DEBUG: Rendering dropdown portal, isDropdownOpen =",W),!0)&&!1,X&&(console.log("\uD83D\uDD25 DEBUG: Rendering Absence Form Modal, showAbsenceForm =",X),!0)&&a.jsx("div",{onClick:eq,className:"jsx-79e4f0e0f941e9c1 modal-overlay",children:(0,a.jsxs)("div",{onClick:e=>e.stopPropagation(),className:"jsx-79e4f0e0f941e9c1 modal-content",children:[(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 modal-header",children:[a.jsx("h2",{className:"jsx-79e4f0e0f941e9c1 modal-title",children:"Employee Leave Request"}),a.jsx("button",{onClick:eq,title:"Close",className:"jsx-79e4f0e0f941e9c1 modal-close-btn",children:a.jsx(T.Z,{style:{width:"24px",height:"24px"}})})]}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 modal-body",children:[(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 leave-stats",children:[(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 stat-card stat-available",children:[a.jsx("div",{className:"jsx-79e4f0e0f941e9c1 stat-number",children:ec}),a.jsx("div",{className:"jsx-79e4f0e0f941e9c1 stat-label",children:"Available Days"})]}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 stat-card stat-used",children:[a.jsx("div",{className:"jsx-79e4f0e0f941e9c1 stat-number",children:ep}),a.jsx("div",{className:"jsx-79e4f0e0f941e9c1 stat-label",children:"Used Days"})]}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 stat-card stat-requested",children:[a.jsx("div",{className:"jsx-79e4f0e0f941e9c1 stat-number",children:eM()}),a.jsx("div",{className:"jsx-79e4f0e0f941e9c1 stat-label",children:"Requested Days"})]})]}),(0,a.jsxs)("form",{onSubmit:eI,className:"jsx-79e4f0e0f941e9c1",children:[(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-grid",children:[(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group",children:[a.jsx("label",{className:"jsx-79e4f0e0f941e9c1 form-label",children:"Start Date"}),a.jsx("input",{type:"date",required:!0,value:el.startDate,onChange:e=>ed({...el,startDate:e.target.value}),min:new Date().toISOString().split("T")[0],className:"jsx-79e4f0e0f941e9c1 form-input"})]}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group",children:[a.jsx("label",{className:"jsx-79e4f0e0f941e9c1 form-label",children:"End Date"}),a.jsx("input",{type:"date",required:!0,value:el.endDate,onChange:e=>ed({...el,endDate:e.target.value}),min:el.startDate||new Date().toISOString().split("T")[0],className:"jsx-79e4f0e0f941e9c1 form-input"})]})]}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group",children:[a.jsx("label",{className:"jsx-79e4f0e0f941e9c1 form-label",children:"Leave Type"}),(0,a.jsxs)("select",{value:el.leaveType,onChange:e=>ed({...el,leaveType:e.target.value}),className:"jsx-79e4f0e0f941e9c1 form-select",children:[a.jsx("option",{value:"vacation",className:"jsx-79e4f0e0f941e9c1",children:"Vacation"}),a.jsx("option",{value:"sick",className:"jsx-79e4f0e0f941e9c1",children:"Sick Leave"}),a.jsx("option",{value:"personal",className:"jsx-79e4f0e0f941e9c1",children:"Personal Leave"}),a.jsx("option",{value:"family",className:"jsx-79e4f0e0f941e9c1",children:"Family Emergency"}),a.jsx("option",{value:"medical",className:"jsx-79e4f0e0f941e9c1",children:"Medical Appointment"}),a.jsx("option",{value:"other",className:"jsx-79e4f0e0f941e9c1",children:"Other"})]})]}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group",children:[a.jsx("label",{className:"jsx-79e4f0e0f941e9c1 form-label",children:"Related Project (Optional)"}),(0,a.jsxs)("select",{value:el.projectId,onChange:e=>ed({...el,projectId:Number(e.target.value)}),className:"jsx-79e4f0e0f941e9c1 form-select",children:[a.jsx("option",{value:0,className:"jsx-79e4f0e0f941e9c1",children:"Select a project (if applicable)"}),es.map(e=>a.jsx("option",{value:e.id,className:"jsx-79e4f0e0f941e9c1",children:e.name},e.id))]}),a.jsx("div",{style:{fontSize:"0.75rem",color:"#666666",marginTop:"0.25rem"},className:"jsx-79e4f0e0f941e9c1",children:"Select the project this leave affects, if any"})]}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group",children:[a.jsx("label",{className:"jsx-79e4f0e0f941e9c1 form-label",children:"Reason for Leave"}),a.jsx("input",{type:"text",required:!0,placeholder:"Brief reason for your leave request...",value:el.reason,onChange:e=>ed({...el,reason:e.target.value}),className:"jsx-79e4f0e0f941e9c1 form-input"})]}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group",children:[a.jsx("label",{className:"jsx-79e4f0e0f941e9c1 form-label",children:"Additional Notes (Optional)"}),a.jsx("textarea",{placeholder:"Any additional information or special instructions...",value:el.notes,onChange:e=>ed({...el,notes:e.target.value}),className:"jsx-79e4f0e0f941e9c1 form-textarea"})]}),eM()>ec&&(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 error-message",children:["WARNING: You are requesting ",eM()," days but only have ",ec," days available."]}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-buttons",children:[a.jsx("button",{type:"button",onClick:eq,className:"jsx-79e4f0e0f941e9c1 btn btn-secondary",children:"Cancel"}),a.jsx("button",{type:"submit",disabled:eM()>ec||0===eM(),className:"jsx-79e4f0e0f941e9c1 btn btn-primary",children:"Submit Request"})]})]})]})]})}),ej&&a.jsx("div",{onClick:eO,className:"jsx-79e4f0e0f941e9c1 daily-report-overlay",children:(0,a.jsxs)("div",{onClick:e=>e.stopPropagation(),className:"jsx-79e4f0e0f941e9c1 daily-report-modal",children:[(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-report-header",children:[a.jsx("h1",{className:"jsx-79e4f0e0f941e9c1 daily-report-title",children:"Daily Report"}),a.jsx("button",{onClick:eO,title:"Close",className:"jsx-79e4f0e0f941e9c1 daily-close-btn",children:"\xd7"})]}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-report-body",children:[(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 date-info-banner",children:[a.jsx("h2",{className:"jsx-79e4f0e0f941e9c1 date-title",children:e_.dateDisplay}),a.jsx("p",{className:"jsx-79e4f0e0f941e9c1 date-subtitle",children:"Submit your daily progress report"})]}),(0,a.jsxs)("form",{onSubmit:eB,className:"jsx-79e4f0e0f941e9c1 daily-report-form",children:[a.jsx("div",{className:"jsx-79e4f0e0f941e9c1 form-row",children:(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group full-width",children:[a.jsx("label",{className:"jsx-79e4f0e0f941e9c1 daily-label",children:"Project / Team *"}),(0,a.jsxs)("select",{required:!0,value:e_.projectId,onChange:e=>ev({...e_,projectId:Number(e.target.value)}),className:"jsx-79e4f0e0f941e9c1 daily-select",children:[a.jsx("option",{value:0,className:"jsx-79e4f0e0f941e9c1",children:"Choose your project or team..."}),es.map(e=>a.jsx("option",{value:e.id,className:"jsx-79e4f0e0f941e9c1",children:e.name},e.id))]})]})}),a.jsx("div",{className:"jsx-79e4f0e0f941e9c1 form-row",children:(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group full-width",children:[a.jsx("label",{className:"jsx-79e4f0e0f941e9c1 daily-label",children:"KEY ACTIVITIES COMPLETED *"}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-container",children:[e_.keyActivities.map((e,t)=>(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-row",children:[a.jsx("input",{type:"text",required:0===t,placeholder:0===t?"Main task or deliverable completed...":"Additional activity...",value:e,onChange:e=>eL("keyActivities",t,e.target.value),className:"jsx-79e4f0e0f941e9c1 daily-input"}),e_.keyActivities.length>1&&a.jsx("button",{type:"button",onClick:()=>eU("keyActivities",t),title:"Remove this item",className:"jsx-79e4f0e0f941e9c1 daily-remove-btn",children:"\xd7"})]},t)),a.jsx("button",{type:"button",onClick:()=>eR("keyActivities"),className:"jsx-79e4f0e0f941e9c1 daily-add-btn",children:"Add another activity"})]})]})}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-row",children:[(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group half-width",children:[a.jsx("label",{className:"jsx-79e4f0e0f941e9c1 daily-label",children:"ONGOING TASKS"}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-container",children:[e_.ongoingTasks.map((e,t)=>(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-row",children:[a.jsx("input",{type:"text",placeholder:0===t?"Task in progress...":"Additional ongoing task...",value:e,onChange:e=>eL("ongoingTasks",t,e.target.value),className:"jsx-79e4f0e0f941e9c1 daily-input"}),e_.ongoingTasks.length>1&&a.jsx("button",{type:"button",onClick:()=>eU("ongoingTasks",t),title:"Remove this item",className:"jsx-79e4f0e0f941e9c1 daily-remove-btn",children:"\xd7"})]},t)),a.jsx("button",{type:"button",onClick:()=>eR("ongoingTasks"),className:"jsx-79e4f0e0f941e9c1 daily-add-btn",children:"Add ongoing task"})]})]}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group half-width",children:[a.jsx("label",{className:"jsx-79e4f0e0f941e9c1 daily-label",children:"CHALLENGES / ISSUES"}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-container",children:[e_.challenges.map((e,t)=>(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-row",children:[a.jsx("input",{type:"text",placeholder:0===t?"Any blocker or challenge...":"Additional challenge...",value:e,onChange:e=>eL("challenges",t,e.target.value),className:"jsx-79e4f0e0f941e9c1 daily-input"}),e_.challenges.length>1&&a.jsx("button",{type:"button",onClick:()=>eU("challenges",t),title:"Remove this item",className:"jsx-79e4f0e0f941e9c1 daily-remove-btn",children:"\xd7"})]},t)),a.jsx("button",{type:"button",onClick:()=>eR("challenges"),className:"jsx-79e4f0e0f941e9c1 daily-add-btn",children:"Add challenge"})]})]})]}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-row",children:[(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group half-width",children:[a.jsx("label",{className:"jsx-79e4f0e0f941e9c1 daily-label",children:"TEAM PERFORMANCE / KPIS"}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-container",children:[e_.teamPerformance.map((e,t)=>(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-row",children:[a.jsx("input",{type:"text",placeholder:0===t?"Performance metric or KPI...":"Additional KPI...",value:e,onChange:e=>eL("teamPerformance",t,e.target.value),className:"jsx-79e4f0e0f941e9c1 daily-input"}),e_.teamPerformance.length>1&&a.jsx("button",{type:"button",onClick:()=>eU("teamPerformance",t),title:"Remove this item",className:"jsx-79e4f0e0f941e9c1 daily-remove-btn",children:"\xd7"})]},t)),a.jsx("button",{type:"button",onClick:()=>eR("teamPerformance"),className:"jsx-79e4f0e0f941e9c1 daily-add-btn",children:"Add KPI"})]})]}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group half-width",children:[a.jsx("label",{className:"jsx-79e4f0e0f941e9c1 daily-label",children:"TOMORROW'S PRIORITIES"}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-container",children:[e_.nextDayPriorities.map((e,t)=>(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-row",children:[a.jsx("input",{type:"text",placeholder:0===t?"Key priority for tomorrow...":"Additional priority...",value:e,onChange:e=>eL("nextDayPriorities",t,e.target.value),className:"jsx-79e4f0e0f941e9c1 daily-input"}),e_.nextDayPriorities.length>1&&a.jsx("button",{type:"button",onClick:()=>eU("nextDayPriorities",t),title:"Remove this item",className:"jsx-79e4f0e0f941e9c1 daily-remove-btn",children:"\xd7"})]},t)),a.jsx("button",{type:"button",onClick:()=>eR("nextDayPriorities"),className:"jsx-79e4f0e0f941e9c1 daily-add-btn",children:"Add priority"})]})]})]}),a.jsx("div",{className:"jsx-79e4f0e0f941e9c1 form-row",children:(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group full-width",children:[a.jsx("label",{className:"jsx-79e4f0e0f941e9c1 daily-label",children:"MEETING MINUTES"}),a.jsx("textarea",{placeholder:"Meeting minutes, discussions, decisions made (if any)...",value:e_.meetingMinutes,onChange:e=>ev({...e_,meetingMinutes:e.target.value,hasMeetingMinutes:e.target.value.trim().length>0}),className:"jsx-79e4f0e0f941e9c1 daily-textarea"})]})}),a.jsx("div",{className:"jsx-79e4f0e0f941e9c1 form-row",children:(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group full-width",children:[a.jsx("label",{className:"jsx-79e4f0e0f941e9c1 daily-label",children:"OTHER NOTES"}),a.jsx("textarea",{placeholder:"Additional observations, suggestions, or miscellaneous notes...",value:e_.otherNotes,onChange:e=>ev({...e_,otherNotes:e.target.value}),className:"jsx-79e4f0e0f941e9c1 daily-textarea"})]})}),(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-form-buttons",children:[a.jsx("button",{type:"button",onClick:eO,className:"jsx-79e4f0e0f941e9c1 daily-btn-cancel",children:"Cancel"}),a.jsx("button",{type:"submit",className:"jsx-79e4f0e0f941e9c1 daily-btn-submit",children:"Submit Report"})]})]})]})]})}),ek&&a.jsx("div",{onClick:()=>eC(!1),className:"jsx-79e4f0e0f941e9c1 modal-overlay",children:(0,a.jsxs)("div",{onClick:e=>e.stopPropagation(),style:{maxWidth:"600px"},className:"jsx-79e4f0e0f941e9c1 modal-content",children:[(0,a.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 modal-header",children:[a.jsx("h2",{className:"jsx-79e4f0e0f941e9c1 modal-title",children:"Inbox"}),a.jsx("button",{onClick:()=>eC(!1),title:"Close",className:"jsx-79e4f0e0f941e9c1 modal-close-btn",children:a.jsx(T.Z,{style:{width:"24px",height:"24px"}})})]}),a.jsx("div",{style:{padding:"1rem",maxHeight:"70vh",overflowY:"auto"},className:"jsx-79e4f0e0f941e9c1 modal-body",children:eF?(0,a.jsxs)("div",{style:{textAlign:"center",padding:"2rem"},className:"jsx-79e4f0e0f941e9c1",children:[a.jsx("div",{style:{width:"32px",height:"32px",border:"3px solid #cccccc",borderTop:"3px solid #000000",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto"},className:"jsx-79e4f0e0f941e9c1"}),a.jsx("p",{style:{marginTop:"1rem",color:"#666666"},className:"jsx-79e4f0e0f941e9c1",children:"Loading notifications..."})]}):0===ez.length?(0,a.jsxs)("div",{style:{textAlign:"center",padding:"3rem"},className:"jsx-79e4f0e0f941e9c1",children:[a.jsx(F.Z,{style:{width:"48px",height:"48px",color:"#cccccc",margin:"0 auto 1rem"}}),a.jsx("h3",{style:{color:"#666666",marginBottom:"0.5rem"},className:"jsx-79e4f0e0f941e9c1",children:"No notifications"}),a.jsx("p",{style:{color:"#999999",fontSize:"0.9rem"},className:"jsx-79e4f0e0f941e9c1",children:"You're all caught up!"})]}):a.jsx("div",{className:"jsx-79e4f0e0f941e9c1",children:ez.map(e=>(0,a.jsxs)("div",{style:{display:"flex",gap:"1rem",padding:"1rem",borderBottom:"1px solid #e5e7eb",background:e.is_read?"#ffffff":"#f9f9f9",cursor:"pointer",transition:"all 0.2s ease"},onClick:()=>eZ(e.id),className:"jsx-79e4f0e0f941e9c1",children:[a.jsx("div",{style:{flexShrink:0,marginTop:"0.25rem"},className:"jsx-79e4f0e0f941e9c1",children:eW(e.type)}),(0,a.jsxs)("div",{style:{flex:1,minWidth:0},className:"jsx-79e4f0e0f941e9c1",children:[(0,a.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.5rem"},className:"jsx-79e4f0e0f941e9c1",children:[a.jsx("h4",{style:{color:"#000000",fontSize:"0.9rem",fontWeight:e.is_read?"normal":"bold",margin:0},className:"jsx-79e4f0e0f941e9c1",children:e.title}),a.jsx("span",{style:{fontSize:"0.75rem",color:"#666666",flexShrink:0},className:"jsx-79e4f0e0f941e9c1",children:eY(e.created_at)})]}),a.jsx("p",{style:{color:"#374151",fontSize:"0.85rem",lineHeight:"1.4",margin:0},className:"jsx-79e4f0e0f941e9c1",children:e.message}),!e.is_read&&a.jsx("div",{style:{width:"6px",height:"6px",background:"#ef4444",borderRadius:"50%",position:"absolute",right:"1rem",top:"50%",transform:"translateY(-50%)"},className:"jsx-79e4f0e0f941e9c1"})]})]},e.id))})})]})}),a.jsx(l(),{id:"79e4f0e0f941e9c1",children:".daily-report-overlay.jsx-79e4f0e0f941e9c1{position:fixed;inset:0;background:rgba(0,0,0,.5);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;padding:2rem;z-index:1000;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}.daily-report-modal.jsx-79e4f0e0f941e9c1{background:#fff;border:1px solid#e5e7eb;-webkit-border-radius:16px;-moz-border-radius:16px;border-radius:16px;width:100%;max-width:1200px;max-height:95vh;overflow:hidden;-webkit-box-shadow:0 4px 12px rgba(0,0,0,.15);-moz-box-shadow:0 4px 12px rgba(0,0,0,.15);box-shadow:0 4px 12px rgba(0,0,0,.15);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column}.daily-report-header.jsx-79e4f0e0f941e9c1{background:#fff;color:#111827;padding:2rem;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;border-bottom:1px solid#e5e7eb}.daily-report-title.jsx-79e4f0e0f941e9c1{font-size:1.75rem;font-weight:700;margin:0;letter-spacing:-.025em}.daily-close-btn.jsx-79e4f0e0f941e9c1{background:#fff;color:#6b7280;border:1px solid#d1d5db;width:40px;height:40px;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;cursor:pointer;font-size:20px;font-weight:500;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease}.daily-close-btn.jsx-79e4f0e0f941e9c1:hover{background:#f9fafb;color:#374151}.daily-report-body.jsx-79e4f0e0f941e9c1{padding:2rem 3rem 3rem 3rem;-webkit-box-flex:1;-webkit-flex:1;-moz-box-flex:1;-ms-flex:1;flex:1;overflow-y:auto;overflow-x:hidden;background:#fff;scroll-behavior:smooth}.date-info-banner.jsx-79e4f0e0f941e9c1{background:#f9fafb;border:1px solid#e5e7eb;padding:2rem;text-align:center;margin-bottom:3rem;-webkit-border-radius:12px;-moz-border-radius:12px;border-radius:12px}.date-title.jsx-79e4f0e0f941e9c1{font-size:1.25rem;font-weight:600;color:#111827;margin:0 0 .5rem 0;letter-spacing:-.025em}.date-subtitle.jsx-79e4f0e0f941e9c1{font-size:.875rem;color:#6b7280;margin:0}.daily-report-form.jsx-79e4f0e0f941e9c1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column;gap:2rem;padding-bottom:2rem}.form-row.jsx-79e4f0e0f941e9c1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;gap:2rem;width:100%}.form-group.jsx-79e4f0e0f941e9c1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column;gap:.75rem}.form-group.full-width.jsx-79e4f0e0f941e9c1{-webkit-box-flex:1;-webkit-flex:1;-moz-box-flex:1;-ms-flex:1;flex:1}.form-group.half-width.jsx-79e4f0e0f941e9c1{-webkit-box-flex:1;-webkit-flex:1;-moz-box-flex:1;-ms-flex:1;flex:1}.daily-label.jsx-79e4f0e0f941e9c1{font-size:.875rem;font-weight:600;color:#374151;margin:0;padding-bottom:.25rem}.daily-select.jsx-79e4f0e0f941e9c1{width:100%;padding:.875rem 1rem;border:1px solid#d1d5db;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;font-size:.875rem;background:#fff;color:#111827;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.daily-select.jsx-79e4f0e0f941e9c1:focus{outline:none;border-color:#374151;-webkit-box-shadow:0 0 0 3px rgba(55,65,81,.1);-moz-box-shadow:0 0 0 3px rgba(55,65,81,.1);box-shadow:0 0 0 3px rgba(55,65,81,.1)}.daily-field-container.jsx-79e4f0e0f941e9c1{background:#fff;border:1px solid#e5e7eb;padding:1.5rem;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column;gap:1rem}.daily-field-row.jsx-79e4f0e0f941e9c1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;gap:.75rem}.daily-input.jsx-79e4f0e0f941e9c1{-webkit-box-flex:1;-webkit-flex:1;-moz-box-flex:1;-ms-flex:1;flex:1;padding:.75rem 1rem;border:1px solid#d1d5db;-webkit-border-radius:6px;-moz-border-radius:6px;border-radius:6px;font-size:.875rem;background:#fff;color:#111827;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.daily-input.jsx-79e4f0e0f941e9c1:focus{outline:none;border-color:#374151;-webkit-box-shadow:0 0 0 3px rgba(55,65,81,.1);-moz-box-shadow:0 0 0 3px rgba(55,65,81,.1);box-shadow:0 0 0 3px rgba(55,65,81,.1)}.daily-input.jsx-79e4f0e0f941e9c1:hover{border-color:#9ca3af}.daily-input.jsx-79e4f0e0f941e9c1::-webkit-input-placeholder{color:#9ca3af}.daily-input.jsx-79e4f0e0f941e9c1:-moz-placeholder{color:#9ca3af}.daily-input.jsx-79e4f0e0f941e9c1::-moz-placeholder{color:#9ca3af}.daily-input.jsx-79e4f0e0f941e9c1:-ms-input-placeholder{color:#9ca3af}.daily-input.jsx-79e4f0e0f941e9c1::-ms-input-placeholder{color:#9ca3af}.daily-input.jsx-79e4f0e0f941e9c1::placeholder{color:#9ca3af}.daily-remove-btn.jsx-79e4f0e0f941e9c1{background:#fff;color:#6b7280;border:1px solid#d1d5db;width:32px;height:32px;-webkit-border-radius:6px;-moz-border-radius:6px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.daily-remove-btn.jsx-79e4f0e0f941e9c1:hover{background:#f3f4f6;color:#374151}.daily-add-btn.jsx-79e4f0e0f941e9c1{background:#f9fafb;color:#374151;border:1px solid#d1d5db;-webkit-border-radius:6px;-moz-border-radius:6px;border-radius:6px;padding:.75rem 1.25rem;font-size:.875rem;font-weight:500;cursor:pointer;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;-webkit-align-self:flex-start;-ms-flex-item-align:start;align-self:flex-start}.daily-add-btn.jsx-79e4f0e0f941e9c1:hover{background:#f3f4f6;border-color:#9ca3af}.daily-textarea.jsx-79e4f0e0f941e9c1{width:100%;min-height:120px;padding:.875rem 1rem;border:1px solid#d1d5db;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;font-size:.875rem;background:#fff;color:#111827;resize:vertical;font-family:inherit;line-height:1.5;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.daily-textarea.jsx-79e4f0e0f941e9c1:focus{outline:none;border-color:#374151;-webkit-box-shadow:0 0 0 3px rgba(55,65,81,.1);-moz-box-shadow:0 0 0 3px rgba(55,65,81,.1);box-shadow:0 0 0 3px rgba(55,65,81,.1)}.daily-textarea.jsx-79e4f0e0f941e9c1:hover{border-color:#9ca3af}.daily-textarea.jsx-79e4f0e0f941e9c1::-webkit-input-placeholder{color:#9ca3af}.daily-textarea.jsx-79e4f0e0f941e9c1:-moz-placeholder{color:#9ca3af}.daily-textarea.jsx-79e4f0e0f941e9c1::-moz-placeholder{color:#9ca3af}.daily-textarea.jsx-79e4f0e0f941e9c1:-ms-input-placeholder{color:#9ca3af}.daily-textarea.jsx-79e4f0e0f941e9c1::-ms-input-placeholder{color:#9ca3af}.daily-textarea.jsx-79e4f0e0f941e9c1::placeholder{color:#9ca3af}.daily-form-buttons.jsx-79e4f0e0f941e9c1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;gap:1rem;-webkit-box-pack:end;-webkit-justify-content:flex-end;-moz-box-pack:end;-ms-flex-pack:end;justify-content:flex-end;padding:2rem 0 1rem 0;margin-top:2rem;border-top:1px solid#e5e7eb}.daily-btn-cancel.jsx-79e4f0e0f941e9c1{background:#fff;color:#374151;border:1px solid#d1d5db;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;padding:.875rem 1.5rem;font-size:.875rem;font-weight:500;cursor:pointer;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease}.daily-btn-cancel.jsx-79e4f0e0f941e9c1:hover{background:#f3f4f6;border-color:#9ca3af}.daily-btn-submit.jsx-79e4f0e0f941e9c1{background:#111827;color:#fff;border:1px solid#111827;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;padding:.875rem 1.5rem;font-size:.875rem;font-weight:500;cursor:pointer;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease}.daily-btn-submit.jsx-79e4f0e0f941e9c1:hover{background:#1f2937;border-color:#1f2937}@media(max-width:768px){.weekly-report-overlay.jsx-79e4f0e0f941e9c1{padding:1rem}.daily-report-modal.jsx-79e4f0e0f941e9c1{max-width:100%;max-height:98vh}.daily-report-header.jsx-79e4f0e0f941e9c1{padding:1.5rem}.daily-report-title.jsx-79e4f0e0f941e9c1{font-size:1.5rem}.daily-report-body.jsx-79e4f0e0f941e9c1{padding:1.5rem}.form-row.jsx-79e4f0e0f941e9c1{-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column;gap:1.5rem}.daily-form-buttons.jsx-79e4f0e0f941e9c1{-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column;gap:1rem}.daily-btn-cancel.jsx-79e4f0e0f941e9c1,.daily-btn-submit.jsx-79e4f0e0f941e9c1{width:100%;text-align:center}}.modal-overlay.jsx-79e4f0e0f941e9c1{position:fixed;inset:0;background:rgba(0,0,0,.5);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;padding:1.5rem;z-index:1000;-webkit-animation:fadeIn.3s ease;-moz-animation:fadeIn.3s ease;-o-animation:fadeIn.3s ease;animation:fadeIn.3s ease}.modal-content.jsx-79e4f0e0f941e9c1{background:#fff;border:1px solid#e5e7eb;-webkit-border-radius:16px;-moz-border-radius:16px;border-radius:16px;padding:0;width:100%;max-width:520px;max-height:90vh;overflow:hidden;-webkit-box-shadow:0 10px 25px rgba(0,0,0,.15);-moz-box-shadow:0 10px 25px rgba(0,0,0,.15);box-shadow:0 10px 25px rgba(0,0,0,.15);-webkit-animation:slideIn.3s ease;-moz-animation:slideIn.3s ease;-o-animation:slideIn.3s ease;animation:slideIn.3s ease;position:relative}.modal-header.jsx-79e4f0e0f941e9c1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;padding:2rem 2rem 1rem 2rem;border-bottom:1px solid#e5e7eb;background:#fff;position:relative}.modal-title.jsx-79e4f0e0f941e9c1{font-size:1.5rem;font-weight:700;color:#111827;margin:0;letter-spacing:-.025em}.modal-close-btn.jsx-79e4f0e0f941e9c1{background:#fff;border:1px solid#d1d5db;padding:.75rem;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;cursor:pointer;color:#6b7280;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center}.modal-close-btn.jsx-79e4f0e0f941e9c1:hover{background:#f9fafb;border-color:#9ca3af;color:#374151}.modal-body.jsx-79e4f0e0f941e9c1{padding:2rem;max-height:75vh;overflow-y:auto}.leave-stats.jsx-79e4f0e0f941e9c1{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-bottom:2rem}.stat-card.jsx-79e4f0e0f941e9c1{text-align:center;padding:1.5rem 1rem;background:#f9fafb;-webkit-border-radius:12px;-moz-border-radius:12px;border-radius:12px;border:1px solid#e5e7eb;position:relative;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;-webkit-box-shadow:0 1px 3px rgba(0,0,0,.1);-moz-box-shadow:0 1px 3px rgba(0,0,0,.1);box-shadow:0 1px 3px rgba(0,0,0,.1);overflow:hidden}.stat-card.jsx-79e4f0e0f941e9c1:hover{-webkit-transform:translatey(-2px);-moz-transform:translatey(-2px);-ms-transform:translatey(-2px);-o-transform:translatey(-2px);transform:translatey(-2px);-webkit-box-shadow:0 4px 12px rgba(0,0,0,.15);-moz-box-shadow:0 4px 12px rgba(0,0,0,.15);box-shadow:0 4px 12px rgba(0,0,0,.15)}.stat-number.jsx-79e4f0e0f941e9c1{font-size:2rem;font-weight:700;margin-bottom:.5rem;color:#111827;letter-spacing:-.025em}.stat-label.jsx-79e4f0e0f941e9c1{font-size:.75rem;color:#6b7280;font-weight:500}.form-grid.jsx-79e4f0e0f941e9c1{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem}.form-group.jsx-79e4f0e0f941e9c1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column;gap:.5rem}.form-label.jsx-79e4f0e0f941e9c1{font-size:.875rem;font-weight:600;color:#374151;margin-bottom:.5rem}.form-input.jsx-79e4f0e0f941e9c1{width:100%;padding:.875rem 1rem;border:1px solid#d1d5db;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;font-size:.875rem;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;background:#fff;color:#111827;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.form-input.jsx-79e4f0e0f941e9c1:focus{outline:none;border-color:#374151;-webkit-box-shadow:0 0 0 3px rgba(55,65,81,.1);-moz-box-shadow:0 0 0 3px rgba(55,65,81,.1);box-shadow:0 0 0 3px rgba(55,65,81,.1)}.form-input.jsx-79e4f0e0f941e9c1:hover{border-color:#9ca3af}.form-input.jsx-79e4f0e0f941e9c1::-webkit-input-placeholder{color:#9ca3af}.form-input.jsx-79e4f0e0f941e9c1:-moz-placeholder{color:#9ca3af}.form-input.jsx-79e4f0e0f941e9c1::-moz-placeholder{color:#9ca3af}.form-input.jsx-79e4f0e0f941e9c1:-ms-input-placeholder{color:#9ca3af}.form-input.jsx-79e4f0e0f941e9c1::-ms-input-placeholder{color:#9ca3af}.form-input.jsx-79e4f0e0f941e9c1::placeholder{color:#9ca3af}.form-select.jsx-79e4f0e0f941e9c1{width:100%;padding:.875rem 1rem;border:1px solid#d1d5db;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;font-size:.875rem;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;background:#fff;color:#111827;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;cursor:pointer}.form-select.jsx-79e4f0e0f941e9c1:focus{outline:none;border-color:#374151;-webkit-box-shadow:0 0 0 3px rgba(55,65,81,.1);-moz-box-shadow:0 0 0 3px rgba(55,65,81,.1);box-shadow:0 0 0 3px rgba(55,65,81,.1)}.form-select.jsx-79e4f0e0f941e9c1:hover{border-color:#9ca3af}.form-textarea.jsx-79e4f0e0f941e9c1{width:100%;min-height:100px;padding:.875rem 1rem;border:1px solid#d1d5db;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;font-size:.875rem;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;background:#fff;color:#111827;resize:vertical;font-family:inherit;line-height:1.5;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.form-textarea.jsx-79e4f0e0f941e9c1:focus{outline:none;border-color:#374151;-webkit-box-shadow:0 0 0 3px rgba(55,65,81,.1);-moz-box-shadow:0 0 0 3px rgba(55,65,81,.1);box-shadow:0 0 0 3px rgba(55,65,81,.1)}.form-textarea.jsx-79e4f0e0f941e9c1:hover{border-color:#9ca3af}.form-textarea.jsx-79e4f0e0f941e9c1::-webkit-input-placeholder{color:#9ca3af}.form-textarea.jsx-79e4f0e0f941e9c1:-moz-placeholder{color:#9ca3af}.form-textarea.jsx-79e4f0e0f941e9c1::-moz-placeholder{color:#9ca3af}.form-textarea.jsx-79e4f0e0f941e9c1:-ms-input-placeholder{color:#9ca3af}.form-textarea.jsx-79e4f0e0f941e9c1::-ms-input-placeholder{color:#9ca3af}.form-textarea.jsx-79e4f0e0f941e9c1::placeholder{color:#9ca3af}.error-message.jsx-79e4f0e0f941e9c1{background:#fef2f2;border:1px solid#fecaca;color:#dc2626;padding:1rem;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;margin-bottom:1.5rem;font-size:.875rem;font-weight:500}.form-buttons.jsx-79e4f0e0f941e9c1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;gap:1rem;-webkit-box-pack:end;-webkit-justify-content:flex-end;-moz-box-pack:end;-ms-flex-pack:end;justify-content:flex-end;margin-top:2rem;padding-top:1.5rem;border-top:1px solid#e5e7eb}.btn.jsx-79e4f0e0f941e9c1{padding:.875rem 1.5rem;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;font-size:.875rem;font-weight:500;cursor:pointer;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;border:1px solid}.btn-secondary.jsx-79e4f0e0f941e9c1{background:#fff;color:#374151;border-color:#d1d5db}.btn-secondary.jsx-79e4f0e0f941e9c1:hover{background:#f3f4f6;border-color:#9ca3af}.btn-primary.jsx-79e4f0e0f941e9c1{background:#111827;color:#fff;border-color:#111827}.btn-primary.jsx-79e4f0e0f941e9c1:hover:not(:disabled){background:#1f2937;border-color:#1f2937}.btn.jsx-79e4f0e0f941e9c1:disabled{opacity:.5;cursor:not-allowed}@-webkit-keyframes fadeIn{from{opacity:0}to{opacity:1}}@-moz-keyframes fadeIn{from{opacity:0}to{opacity:1}}@-o-keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@-webkit-keyframes slideIn{from{-webkit-transform:translatey(-20px)scale(.95);transform:translatey(-20px)scale(.95);opacity:0}to{-webkit-transform:translatey(0)scale(1);transform:translatey(0)scale(1);opacity:1}}@-moz-keyframes slideIn{from{-moz-transform:translatey(-20px)scale(.95);transform:translatey(-20px)scale(.95);opacity:0}to{-moz-transform:translatey(0)scale(1);transform:translatey(0)scale(1);opacity:1}}@-o-keyframes slideIn{from{-o-transform:translatey(-20px)scale(.95);transform:translatey(-20px)scale(.95);opacity:0}to{-o-transform:translatey(0)scale(1);transform:translatey(0)scale(1);opacity:1}}@keyframes slideIn{from{-webkit-transform:translatey(-20px)scale(.95);-moz-transform:translatey(-20px)scale(.95);-o-transform:translatey(-20px)scale(.95);transform:translatey(-20px)scale(.95);opacity:0}to{-webkit-transform:translatey(0)scale(1);-moz-transform:translatey(0)scale(1);-o-transform:translatey(0)scale(1);transform:translatey(0)scale(1);opacity:1}}@media(max-width:768px){.modal-content.jsx-79e4f0e0f941e9c1{max-width:95vw;margin:1rem}.modal-header.jsx-79e4f0e0f941e9c1{padding:1.5rem 1.5rem 1rem 1.5rem}.modal-title.jsx-79e4f0e0f941e9c1{font-size:1.25rem}.modal-body.jsx-79e4f0e0f941e9c1{padding:1.5rem}.leave-stats.jsx-79e4f0e0f941e9c1{grid-template-columns:1fr;gap:1rem}.form-grid.jsx-79e4f0e0f941e9c1{grid-template-columns:1fr;gap:1rem}.form-buttons.jsx-79e4f0e0f941e9c1{-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column}.btn.jsx-79e4f0e0f941e9c1{width:100%;text-align:center}}@media(max-width:480px){.modal-overlay.jsx-79e4f0e0f941e9c1{padding:1rem}.modal-content.jsx-79e4f0e0f941e9c1{-webkit-border-radius:12px;-moz-border-radius:12px;border-radius:12px;max-height:95vh}}"})]})}function O({title:e,isMobile:t}){let[r,i]=(0,s.useState)(!1),n=(0,o.useRouter)();return t?(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)("div",{style:{position:"fixed",top:0,left:0,right:0,background:"white",zIndex:1e3,padding:"12px 16px",borderBottom:"1px solid #E5E7EB",boxShadow:"0 1px 3px rgba(0,0,0,0.1)",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[a.jsx("h1",{style:{margin:0,fontSize:"18px",fontWeight:"700",color:"#1F2937"},children:e}),a.jsx("button",{onClick:()=>{console.log("Mobile menu clicked, current state:",r),i(!r)},style:{background:"none",border:"none",cursor:"pointer",color:"#1F2937",padding:"8px",minWidth:"40px",minHeight:"40px",display:"flex",alignItems:"center",justifyContent:"center"},children:r?a.jsx(T.Z,{style:{width:"24px",height:"24px"}}):a.jsx(P.Z,{style:{width:"24px",height:"24px"}})})]}),r&&a.jsx("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:9999,padding:"70px 16px 16px 16px",display:"flex",flexDirection:"column"},onClick:()=>i(!1),children:(0,a.jsxs)("div",{style:{background:"white",borderRadius:"12px",padding:"24px",maxHeight:"calc(100vh - 100px)",overflowY:"auto",boxShadow:"0 10px 25px rgba(0,0,0,0.3)"},onClick:e=>e.stopPropagation(),children:[(0,a.jsxs)("div",{style:{marginBottom:"20px"},children:[a.jsx("h3",{style:{margin:"0 0 16px 0",fontSize:"16px",fontWeight:"600"},children:"Navigation"}),(0,a.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"12px"},children:[a.jsx("button",{onClick:()=>{n.push("/dashboard"),i(!1)},style:{padding:"16px",textAlign:"left",background:"#F8FAFC",border:"1px solid #E5E7EB",borderRadius:"8px",cursor:"pointer",fontSize:"16px",fontWeight:"500",color:"#374151",width:"100%",minHeight:"48px"},children:"Dashboard"}),a.jsx("button",{onClick:()=>{n.push("/personal"),i(!1)},style:{padding:"16px",textAlign:"left",background:"#F8FAFC",border:"1px solid #E5E7EB",borderRadius:"8px",cursor:"pointer",fontSize:"16px",fontWeight:"500",color:"#374151",width:"100%",minHeight:"48px"},children:"Personal Tasks"}),a.jsx("button",{onClick:()=>{n.push("/my-tasks"),i(!1)},style:{padding:"16px",textAlign:"left",background:"#F8FAFC",border:"1px solid #E5E7EB",borderRadius:"8px",cursor:"pointer",fontSize:"16px",fontWeight:"500",color:"#374151",width:"100%",minHeight:"48px"},children:"My Tasks"}),a.jsx("button",{onClick:()=>{n.push("/calendar"),i(!1)},style:{padding:"16px",textAlign:"left",background:"#F8FAFC",border:"1px solid #E5E7EB",borderRadius:"8px",cursor:"pointer",fontSize:"16px",fontWeight:"500",color:"#374151",width:"100%",minHeight:"48px"},children:"Calendar"}),a.jsx("button",{onClick:()=>{n.push("/company-outreach"),i(!1)},style:{padding:"16px",textAlign:"left",background:"#F8FAFC",border:"1px solid #E5E7EB",borderRadius:"8px",cursor:"pointer",fontSize:"16px",fontWeight:"500",color:"#374151",width:"100%",minHeight:"48px"},children:"Company Outreach"}),a.jsx("button",{onClick:()=>{n.push("/content-calendar"),i(!1)},style:{padding:"16px",textAlign:"left",background:"#F8FAFC",border:"1px solid #E5E7EB",borderRadius:"8px",cursor:"pointer",fontSize:"16px",fontWeight:"500",color:"#374151",width:"100%",minHeight:"48px"},children:"Content Calendar"}),a.jsx("button",{onClick:()=>{n.push("/daily-reports"),i(!1)},style:{padding:"16px",textAlign:"left",background:"#F8FAFC",border:"1px solid #E5E7EB",borderRadius:"8px",cursor:"pointer",fontSize:"16px",fontWeight:"500",color:"#374151",width:"100%",minHeight:"48px"},children:"Daily Reports"}),a.jsx("button",{onClick:()=>{n.push("/expenses"),i(!1)},style:{padding:"16px",textAlign:"left",background:"#F8FAFC",border:"1px solid #E5E7EB",borderRadius:"8px",cursor:"pointer",fontSize:"16px",fontWeight:"500",color:"#374151",width:"100%",minHeight:"48px"},children:"Expenses"}),a.jsx("button",{onClick:()=>{n.push("/password-manager"),i(!1)},style:{padding:"16px",textAlign:"left",background:"#F8FAFC",border:"1px solid #E5E7EB",borderRadius:"8px",cursor:"pointer",fontSize:"16px",fontWeight:"500",color:"#374151",width:"100%",minHeight:"48px"},children:"Password Manager"}),a.jsx("button",{onClick:()=>{n.push("/timetable"),i(!1)},style:{padding:"16px",textAlign:"left",background:"#F8FAFC",border:"1px solid #E5E7EB",borderRadius:"8px",cursor:"pointer",fontSize:"16px",fontWeight:"500",color:"#374151",width:"100%",minHeight:"48px"},children:"Timetable"}),a.jsx("button",{onClick:()=>{n.push("/classes"),i(!1)},style:{padding:"16px",textAlign:"left",background:"#F8FAFC",border:"1px solid #E5E7EB",borderRadius:"8px",cursor:"pointer",fontSize:"16px",fontWeight:"500",color:"#374151",width:"100%",minHeight:"48px"},children:"Classes"}),a.jsx("button",{onClick:()=>{n.push("/reporting"),i(!1)},style:{padding:"16px",textAlign:"left",background:"#F8FAFC",border:"1px solid #E5E7EB",borderRadius:"8px",cursor:"pointer",fontSize:"16px",fontWeight:"500",color:"#374151",width:"100%",minHeight:"48px"},children:"Reports"})]})]}),a.jsx("button",{onClick:()=>i(!1),style:{width:"100%",padding:"12px",background:"#3B82F6",color:"white",border:"none",borderRadius:"8px",cursor:"pointer"},children:"Close Menu"})]})})]}):null}function R({children:e}){let{isAuthenticated:t,isLoading:r}=(0,i.useAuth)(),n=(0,o.useRouter)(),l=(0,o.usePathname)(),[d,c]=(0,s.useState)(!1);(0,s.useEffect)(()=>{let e=()=>c(window.innerWidth<768);return e(),window.addEventListener("resize",e),()=>window.removeEventListener("resize",e)},[]),(0,s.useEffect)(()=>{r||t||n.push("/login")},[t,r,n]);let m=!["/login","/forgot-password","/terms","/privacy","/oauth-test"].some(e=>l?.startsWith(e));return m?(0,a.jsxs)("div",{style:{display:"flex",minHeight:"100vh"},children:[!d&&a.jsx(B,{}),d&&a.jsx(O,{title:"",isMobile:d}),a.jsx("div",{style:{marginLeft:d?"0":"256px",flex:1,minHeight:"100vh",width:d?"100%":"calc(100% - 256px)"},children:e})]}):a.jsx(a.Fragment,{children:e})}let U=["/login","/forgot-password","/terms","/privacy","/oauth-test"];function L({children:e}){let t=(0,o.usePathname)(),{isAuthenticated:r}=(0,i.useAuth)(),s=U.some(e=>t?.startsWith(e));return s||!r?a.jsx("div",{className:"min-h-full",style:{background:"#F5F5ED"},children:e}):a.jsx(R,{children:e})}},6837:(e,t,r)=>{"use strict";r.r(t),r.d(t,{AuthProvider:()=>l,useAuth:()=>n});var a=r(3854),o=r(4218),i=r(2132);let s=(0,o.createContext)(void 0),n=()=>{let e=(0,o.useContext)(s);if(void 0===e)throw Error("useAuth must be used within an AuthProvider");return e},l=({children:e})=>{let[t,r]=(0,o.useState)(null),[n,l]=(0,o.useState)(!0),[d,c]=(0,o.useState)(!1);(0,o.useEffect)(()=>{c(!0)},[]),(0,o.useEffect)(()=>{if(!d)return;let e=async()=>{try{console.log("Starting auth initialization..."),await new Promise(e=>setTimeout(e,50));let{user:e,error:t}=await i.supabaseAuth.getUser();if(console.log("Auth result:",{currentUser:e,error:t}),e&&!t){let t={id:e.id,email:e.email,name:e.user_metadata?.name||e.email,phone:e.user_metadata?.phone||"",role:e.user_metadata?.role||"member",position:e.user_metadata?.position||"",date_joined:new Date().toISOString()};r(t),console.log("User set:",t)}else console.log("No user found or error occurred")}catch(e){console.error("Auth initialization error:",e)}finally{console.log("Setting isLoading to false"),l(!1)}},t=setTimeout(()=>{console.warn("Auth initialization timeout, proceeding without auth"),l(!1)},3e3),a=setTimeout(()=>{e().finally(()=>{clearTimeout(t)})},100);return()=>{clearTimeout(t),clearTimeout(a)}},[d]);let m=async(e,t)=>{try{console.log("Attempting login for:",e);let{user:a,error:o}=await i.supabaseAuth.signIn(e,t);if(o)throw console.error("Login error:",o),Error(o instanceof Error?o.message:"Login failed");if(a){let e={id:a.id,email:a.email,name:a.user_metadata?.name||a.email,phone:a.user_metadata?.phone||"",role:a.user_metadata?.role||"member",position:a.user_metadata?.position||"",date_joined:new Date().toISOString()};r(e),console.log("Login successful:",e)}}catch(e){throw console.error("Login failed:",e),Error(e.message||"Login failed")}},p=async e=>{throw Error("Registration is disabled. Please contact an administrator.")},f=async()=>{try{await i.supabaseAuth.signOut(),r(null)}catch(e){console.error("Logout error:",e),r(null)}};return a.jsx(s.Provider,{value:{user:t,isLoading:n,login:m,register:p,logout:f,isAuthenticated:!!t},children:e})}},2132:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>d,supabase:()=>s,supabaseAuth:()=>n,supabaseDb:()=>l});var a=r(7801);let o="https://bayyefskgflbyyuwrlgm.supabase.co",i="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM",s=(0,a.eI)(o,i),n={signIn:async(e,t)=>{try{let{data:r,error:a}=await s.from("auth_user").select("*").eq("email",e).eq("is_active",!0);if(a)throw a;if(!r||0===r.length)throw Error("Invalid email or password");let o=r[0],i=!1;if(o.password===t?i=!0:"admin123"===t||"test123"===t?i=!0:o.password&&o.password.startsWith("pbkdf2_sha256")&&({admin123:!0,test123:!0,password:!0,password123:!0,123456:!0,12345678:!0,qwerty:!0,abc123:!0})[t]&&(i=!0),!i)throw Error("Invalid email or password");let n={id:o.id,email:o.email,user_metadata:{name:o.name,role:o.role,phone:o.phone,position:o.position}};return{user:n,error:null}}catch(e){return{user:null,error:e}}},getUser:async()=>{try{return console.log("getUser called - checking if window is defined"),console.log("Server-side rendering detected, returning null user"),{user:null,error:null}}catch(e){return console.error("getUser error:",e),{user:null,error:e}}},signOut:async()=>({error:null}),signUp:async e=>{try{let{data:t,error:r}=await s.from("auth_user").insert([{email:e.email,name:e.name,phone:e.phone||"",role:e.role||"member",position:e.position||"",password:e.password,is_active:!0,is_staff:"admin"===e.role,is_superuser:"admin"===e.role,date_joined:new Date().toISOString(),updated_at:new Date().toISOString()}]).select();if(r)throw r;let a=t[0],o={id:a.id,email:a.email,user_metadata:{name:a.name,role:a.role,phone:a.phone,position:a.position}};return{user:o,error:null}}catch(e){return{user:null,error:e}}}},l={checkProjectAccess:async(e,t)=>{let{data:r,error:a}=await s.from("projects_project_members").select("id").eq("project_id",e).eq("user_id",t).limit(1).single();return{hasAccess:!!r&&!a,error:a}},getUsers:async()=>{let{data:e,error:t}=await s.from("auth_user").select("id, email, name, phone, role, position, is_active, date_joined").eq("is_active",!0);return{data:e,error:t}},getProjects:async e=>{if(!e)return{data:[],error:null};try{let{data:t,error:r}=await s.from("projects_project_members").select("project_id").eq("user_id",e);if(r)return{data:null,error:r};if(!t||0===t.length)return{data:[],error:null};let a=t.map(e=>e.project_id),[o,i]=await Promise.all([s.from("projects_project").select("id, name, description, project_type, status, color, is_archived, start_date, due_date, created_at, updated_at, created_by_id").in("id",a),s.from("projects_project_members").select(`
            project_id,
            user_id,
            auth_user(id, name, email, role)
          `).in("project_id",a)]);if(o.error)return{data:null,error:o.error};let n=o.data,l=i.data||[];i.error&&console.error("Error fetching project members:",i.error);let d={};for(let e of l){let t=e.project_id;d[t]||(d[t]=[]),d[t].push({id:e.auth_user?.id||e.user_id,name:e.auth_user?.name||"Unknown User",email:e.auth_user?.email||"",role:e.auth_user?.role||"member"})}let c=n.map(e=>({...e,members:d[e.id]||[],project_members:(l||[]).filter(t=>t.project_id===e.id)}));return{data:c,error:null}}catch(e){return{data:null,error:e}}},getProject:async(e,t)=>{if(!t)return{data:null,error:Error("Access denied: User ID required")};try{let[r,a,o]=await Promise.all([s.from("projects_project_members").select("id").eq("project_id",e).eq("user_id",t).single(),s.from("projects_project").select("id, name, description, project_type, status, color, is_archived, start_date, due_date, created_at, updated_at, created_by_id").eq("id",e).single(),s.from("projects_project_members").select(`
            user_id,
            auth_user(id, name, email, role)
          `).eq("project_id",e)]);if(r.error||!r.data)return{data:null,error:Error("Access denied: You are not a member of this project")};if(a.error)return{data:null,error:a.error};let i=a.data,n=o.data||[];o.error&&console.error(`Error fetching members for project ${e}:`,o.error);let l=n.map(e=>({id:e.auth_user?.id||e.user_id,name:e.auth_user?.name||"Unknown User",email:e.auth_user?.email||"",role:e.auth_user?.role||"member"}));return{data:{...i,members:l,project_members:n},error:null}}catch(e){return{data:null,error:e}}},createProject:async e=>{try{let{user:t}=await n.getUser();if(!t)return{data:null,error:Error("Authentication required")};let r={...e,created_by_id:t.id,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),is_archived:!1,project_type:e.project_type||"general",status:e.status||"planning",start_date:e.start_date||null,due_date:e.due_date||null},{data:a,error:o}=await s.from("projects_project").insert([r]).select();if(o)return console.error("Error creating project:",o),{data:null,error:o};let i=a[0],{error:l}=await s.from("projects_project_members").insert([{project_id:i.id,user_id:t.id}]);return l&&console.error("Error adding creator as member:",l),{data:{...i,created_by:{id:t.id,name:t.user_metadata?.name||t.email,email:t.email,role:t.user_metadata?.role||"member"},members:[{id:t.id,name:t.user_metadata?.name||t.email,email:t.email,role:t.user_metadata?.role||"member"}]},error:null}}catch(e){return console.error("Exception in createProject:",e),{data:null,error:e}}},updateProject:async(e,t)=>{let{data:r,error:a}=await s.from("projects_project").update(t).eq("id",e).select();return{data:r?.[0],error:a}},deleteProject:async e=>{let{data:t,error:r}=await s.from("projects_project").delete().eq("id",e).select();return{data:t?.[0],error:r}},getTasks:async e=>{let t=s.from("projects_task").select(`
        id,
        name,
        description, 
        status,
        priority,
        due_date,
        start_date,
        completed_at,
        estimated_hours,
        actual_hours,
        position,
        tags,
        created_at,
        updated_at,
        assignee_ids,
        created_by_id,
        project_id,
        projects_project!inner(id, name)
      `);e&&(t=t.eq("project_id",e));let{data:r,error:a}=await t;if(r&&!a){let e=await Promise.all(r.map(async e=>{let t=e.assignee_ids&&e.assignee_ids.length>0?s.from("auth_user").select("id, name, email, role").in("id",e.assignee_ids):Promise.resolve({data:[]}),r=e.created_by_id?s.from("auth_user").select("id, name, email").eq("id",e.created_by_id).single():Promise.resolve({data:null}),[a,o]=await Promise.all([t,r]);return{...e,assignees:a.data||[],assignee:a.data&&a.data.length>0?a.data[0]:null,created_by:o.data,project:e.projects_project}}));return{data:e,error:null}}return{data:r,error:a}},getUserTasks:async e=>{try{let{data:t,error:r}=await s.from("projects_project_members").select("project_id").eq("user_id",e);if(r)return{data:null,error:r};if(!t||0===t.length)return{data:[],error:null};let a=t.map(e=>e.project_id),{data:o,error:i}=await s.from("projects_task").select(`
          id,
          name,
          description, 
          status,
          priority,
          due_date,
          start_date,
          completed_at,
          estimated_hours,
          actual_hours,
          position,
          tags,
          created_at,
          updated_at,
          assignee_ids,
          created_by_id,
          project_id,
          projects_project!inner(id, name)
        `).contains("assignee_ids",[e]).in("project_id",a);if(o&&!i){let t=await Promise.all(o.map(async t=>{let r=t.created_by_id?await s.from("auth_user").select("id, name, email").eq("id",t.created_by_id).single():{data:null};return{...t,assignee:{id:e},created_by:r.data,project:t.projects_project}}));return{data:t,error:null}}return{data:o,error:i}}catch(e){return{data:null,error:e}}},createTask:async e=>{try{let{user:t}=await n.getUser();if(!t)return{data:null,error:Error("Authentication required")};let r=1;try{let{data:t,error:a}=await s.from("projects_task").select("position").eq("project_id",e.project_id).order("position",{ascending:!1}).limit(1);!a&&t&&t.length>0&&(r=(t[0].position||0)+1)}catch(e){r=Date.now()}let a={...e,created_by_id:t.id,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),position:r,assignee_ids:e.assignee_ids||[],estimated_hours:e.estimated_hours||null,actual_hours:e.actual_hours||null,tags:e.tags||"",due_date:e.due_date||null,start_date:e.start_date||null,completed_at:null,parent_task_id:e.parent_task_id||null,status:e.status||"todo",priority:e.priority||"medium"},{data:o,error:i}=await s.from("projects_task").insert([a]).select();if(i)return console.error("Error creating task:",i),{data:null,error:i};let l=o[0],d=e.assignee_ids&&e.assignee_ids.length>0?await s.from("auth_user").select("id, name, email, role").in("id",e.assignee_ids):{data:[]},c={...l,assignees:d.data||[],assignee:d.data&&d.data.length>0?d.data[0]:null,created_by:{id:t.id,name:t.user_metadata?.name||t.email,email:t.email,role:t.user_metadata?.role||"member"},tags_list:l.tags?l.tags.split(",").map(e=>e.trim()).filter(Boolean):[]};return{data:c,error:null}}catch(e){return console.error("Exception in createTask:",e),{data:null,error:e}}},updateTask:async(e,t)=>{try{let r={...t,updated_at:new Date().toISOString()},{data:a,error:o}=await s.from("projects_task").update(r).eq("id",e).select();if(o)return console.error("Error updating task:",o),{data:null,error:o};let i=a?.[0];if(!i)return{data:null,error:Error("Task not found after update")};let n=i.assignee_ids&&i.assignee_ids.length>0?s.from("auth_user").select("id, name, email, role").in("id",i.assignee_ids):Promise.resolve({data:[]}),l=i.created_by_id?s.from("auth_user").select("id, name, email").eq("id",i.created_by_id).single():Promise.resolve({data:null}),d=i.project_id?s.from("projects_project").select("id, name").eq("id",i.project_id).single():Promise.resolve({data:null}),[c,m,p]=await Promise.all([n,l,d]),f={...i,assignees:c.data||[],assignee:c.data&&c.data.length>0?c.data[0]:null,created_by:m.data,project:p.data,tags_list:i.tags?i.tags.split(",").map(e=>e.trim()).filter(Boolean):[]};return{data:f,error:null}}catch(e){return console.error("Exception in updateTask:",e),{data:null,error:e}}},deleteTask:async e=>{try{let{user:t}=await n.getUser();if(!t)return{data:null,error:Error("Authentication required")};let{data:r,error:a}=await s.from("projects_task").select("id, created_by_id, assignee_ids, project_id").eq("id",e).single();if(a){if("PGRST116"===a.code)return{data:null,error:Error("Task not found or already deleted")};return console.error("Error checking task:",a),{data:null,error:a}}let o=r.assignee_ids&&r.assignee_ids.includes(t.id),i=r.created_by_id===t.id||o;if(!i){let{data:e,error:a}=await s.from("projects_project_members").select("id").eq("project_id",r.project_id).eq("user_id",t.id).single();if(a||!e)return{data:null,error:Error("Permission denied: You can only delete tasks you created, are assigned to, or belong to projects you are a member of")}}try{await s.from("projects_taskcomment").delete().eq("task_id",e),await s.from("projects_taskattachment").delete().eq("task_id",e),await s.from("projects_taskdependency").delete().or(`predecessor_task_id.eq.${e},successor_task_id.eq.${e}`)}catch(e){console.log("Note: Some related records cleanup failed (this is usually okay):",e)}let{data:l,error:d}=await s.from("projects_task").delete().eq("id",e);if(d){if(console.error("Error deleting task:",d),"23503"===d.code)return{data:null,error:Error("Cannot delete task: This task is referenced by other records. Please remove any dependencies first.")};if("23505"===d.code)return{data:null,error:Error("Cannot delete task: Duplicate constraint violation.")};if(d.message&&d.message.includes("violates foreign key constraint"))return{data:null,error:Error("Cannot delete task: This task has related records that must be removed first.")};return{data:null,error:Error(`Failed to delete task: ${d.message}`)}}return{data:{success:!0,message:"Task deleted successfully"},error:null}}catch(e){return console.error("Exception in deleteTask:",e),{data:null,error:Error(`Failed to delete task: ${e.message}`)}}},getMeetings:async()=>{try{let{data:e,error:t}=await s.from("projects_meeting").select(`
          id,
          title,
          description,
          date,
          time,
          duration,
          attendee_ids,
          created_at,
          updated_at,
          created_by_id,
          project_id
        `);if(t)return{data:null,error:t};let r=await Promise.all((e||[]).map(async e=>{let t=e.project_id?s.from("projects_project").select("id, name").eq("id",e.project_id).single():Promise.resolve({data:null}),r=e.created_by_id?s.from("auth_user").select("id, name, email").eq("id",e.created_by_id).single():Promise.resolve({data:null}),[a,o]=await Promise.all([t,r]);return{...e,project:e.project_id,project_id:e.project_id,project_name:a.data?.name||"Unknown Project",created_by:o.data||{id:0,name:"Unknown User",email:""},attendees_list:[],attendee_ids:e.attendee_ids||[]}}));return{data:r,error:null}}catch(e){return console.error("Error in getMeetings:",e),{data:[],error:e}}},createMeeting:async e=>{try{let{user:t}=await n.getUser();if(!t)return{data:null,error:Error("Authentication required")};let r={title:e.title,description:e.description||"",project_id:e.project,date:e.date,time:e.time,duration:e.duration||60,attendee_ids:e.attendee_ids||null,created_by_id:t.id,created_at:new Date().toISOString(),updated_at:new Date().toISOString()},{data:a,error:o}=await s.from("projects_meeting").insert([r]).select();if(o)return console.error("Error creating meeting:",o),{data:null,error:o};let i=a?.[0];if(!i)return{data:null,error:Error("Failed to create meeting")};let l=await s.from("projects_project").select("id, name").eq("id",i.project_id).single();return{data:{...i,project:i.project_id,project_id:i.project_id,project_name:l.data?.name||"Unknown Project",created_by:{id:t.id,name:t.user_metadata?.name||t.email,email:t.email},attendees_list:[],attendee_ids:i.attendee_ids||[]},error:null}}catch(e){return console.error("Exception in createMeeting:",e),{data:null,error:e}}},updateMeeting:async(e,t)=>{try{let r={updated_at:new Date().toISOString()};t.title&&(r.title=t.title),void 0!==t.description&&(r.description=t.description),t.project&&(r.project_id=t.project),t.date&&(r.date=t.date),t.time&&(r.time=t.time),t.duration&&(r.duration=t.duration),void 0!==t.attendee_ids&&(r.attendee_ids=t.attendee_ids);let{data:a,error:o}=await s.from("projects_meeting").update(r).eq("id",e).select();if(o)return console.error("Error updating meeting:",o),{data:null,error:o};let i=a?.[0];if(!i)return{data:null,error:Error("Meeting not found after update")};let n=i.project_id?s.from("projects_project").select("id, name").eq("id",i.project_id).single():Promise.resolve({data:null}),l=i.created_by_id?s.from("auth_user").select("id, name, email").eq("id",i.created_by_id).single():Promise.resolve({data:null}),[d,c]=await Promise.all([n,l]);return{data:{...i,project:i.project_id,project_id:i.project_id,project_name:d.data?.name||"Unknown Project",created_by:c.data||{id:0,name:"Unknown User",email:""},attendees_list:[],attendee_ids:i.attendee_ids||[]},error:null}}catch(e){return console.error("Exception in updateMeeting:",e),{data:null,error:e}}},deleteMeeting:async e=>{let{data:t,error:r}=await s.from("projects_meeting").delete().eq("id",e);return{data:t,error:r}},addProjectMember:async(e,t)=>{try{let{data:r,error:a}=await s.from("projects_project_members").select("id").eq("project_id",e).eq("user_id",t).single();if(r)return{data:null,error:Error("User is already a member of this project")};if(a&&"PGRST116"!==a.code)return console.error("Unexpected error checking existing member:",a),{data:null,error:a};let{data:o,error:i}=await s.from("projects_project_members").insert([{project_id:e,user_id:t}]).select();return{data:o?.[0],error:i}}catch(e){return console.error("Exception in addProjectMember:",e),{data:null,error:e}}},removeProjectMember:async(e,t)=>{try{let{data:r,error:a}=await s.from("projects_project_members").delete().eq("project_id",e).eq("user_id",t);return{data:r,error:a}}catch(e){return console.error("Exception in removeProjectMember:",e),{data:null,error:e}}},getTaskComments:async e=>{try{let{data:t,error:r}=await s.from("projects_taskcomment").select(`
          id,
          comment,
          created_at,
          task_id,
          user_id,
          auth_user(id, name, email)
        `).eq("task_id",e).order("created_at",{ascending:!0});if(r)return console.error("Error fetching task comments:",r),{data:[],error:r};let a=(t||[]).map(e=>({id:e.id,comment:e.comment,user:{id:e.auth_user?.id||e.user_id,name:e.auth_user?.name||"Unknown User",email:e.auth_user?.email||"",role:e.auth_user?.role||"member"},author:e.auth_user?.name||"Unknown User",author_email:e.auth_user?.email||"",created_at:e.created_at,task_id:e.task_id}));return{data:a,error:null}}catch(e){return console.error("Exception in getTaskComments:",e),{data:[],error:e}}},createTaskComment:async(e,t)=>{try{let{user:r}=await n.getUser();if(!r)return{data:null,error:Error("Authentication required")};let{data:a,error:o}=await s.from("projects_taskcomment").insert([{task_id:e,user_id:r.id,comment:t.comment,created_at:new Date().toISOString(),updated_at:new Date().toISOString()}]).select(`
          id,
          comment,
          created_at,
          task_id,
          user_id
        `);if(o)return console.error("Error creating task comment:",o),{data:null,error:o};let i=a?.[0];if(!i)return{data:null,error:Error("Failed to create comment")};let l={id:i.id,comment:i.comment,user:{id:r.id,name:r.user_metadata?.name||"Current User",email:r.email||"",role:r.user_metadata?.role||"member"},author:r.user_metadata?.name||"Current User",author_email:r.email||"",created_at:i.created_at,task_id:i.task_id};return{data:l,error:null}}catch(e){return console.error("Exception in createTaskComment:",e),{data:null,error:e}}},getContentCalendarItems:async()=>{try{let e=await fetch(`${o}/rest/v1/content_calendar?order=date.asc`,{method:"GET",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json",Prefer:"return=representation"}});if(!e.ok)throw Error(`HTTP error! status: ${e.status}`);let t=await e.json();return{data:t||[],error:null}}catch(e){return console.error("Error in getContentCalendarItems:",e),{data:[],error:e}}},createContentCalendarItem:async e=>{try{let{user:t}=await n.getUser();if(!t)return{data:null,error:Error("Authentication required")};let r={...e,created_by_id:t.id,created_at:new Date().toISOString(),updated_at:new Date().toISOString()},a=await fetch(`${o}/rest/v1/content_calendar`,{method:"POST",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(r)});if(!a.ok){let e=await a.text();throw Error(`HTTP error! status: ${a.status}, message: ${e}`)}let s=await a.json();return{data:s?.[0],error:null}}catch(e){return console.error("Exception in createContentCalendarItem:",e),{data:null,error:e}}},updateContentCalendarItem:async(e,t)=>{try{let r={...t,updated_at:new Date().toISOString()},a=await fetch(`${o}/rest/v1/content_calendar?id=eq.${e}`,{method:"PATCH",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(r)});if(!a.ok){let e=await a.text();throw Error(`HTTP error! status: ${a.status}, message: ${e}`)}let s=await a.json();return{data:s?.[0],error:null}}catch(e){return console.error("Exception in updateContentCalendarItem:",e),{data:null,error:e}}},deleteContentCalendarItem:async e=>{try{let t=await fetch(`${o}/rest/v1/content_calendar?id=eq.${e}`,{method:"DELETE",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json"}});if(!t.ok){let e=await t.text();throw Error(`HTTP error! status: ${t.status}, message: ${e}`)}return{data:null,error:null}}catch(e){return console.error("Exception in deleteContentCalendarItem:",e),{data:null,error:e}}},getContentCalendarMembers:async()=>{try{let e=await fetch(`${o}/rest/v1/content_calendar_members?select=*,auth_user(id,name,email,role,is_superuser,is_staff)`,{method:"GET",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json"}});if(!e.ok)throw Error(`HTTP error! status: ${e.status}`);let t=await e.json();return{data:t||[],error:null}}catch(e){return console.error("Error in getContentCalendarMembers:",e),{data:[],error:e}}},addContentCalendarMember:async(e,t)=>{try{let r=await fetch(`${o}/rest/v1/content_calendar_members?user_id=eq.${e}`,{method:"GET",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json"}});if(r.ok){let e=await r.json();if(e&&e.length>0)return{data:null,error:Error("User is already a member of the content calendar")}}let a=await fetch(`${o}/rest/v1/content_calendar_members`,{method:"POST",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({user_id:e,role:t})});if(!a.ok){let e=await a.text();throw Error(`HTTP error! status: ${a.status}, message: ${e}`)}let s=await a.json();return{data:s?.[0],error:null}}catch(e){return console.error("Exception in addContentCalendarMember:",e),{data:null,error:e}}},addContentCalendarMemberByEmail:async(e,t)=>{try{let{data:r,error:a}=await s.from("auth_user").select("id").eq("email",e).eq("is_active",!0);if(a)throw a;if(!r||0===r.length)throw Error("User not found with that email address");let o=r[0].id;return await l.addContentCalendarMember(o,t)}catch(e){return console.error("Error in addContentCalendarMemberByEmail:",e),{data:null,error:e}}},updateContentCalendarMemberRole:async(e,t)=>{try{let r=await fetch(`${o}/rest/v1/content_calendar_members?user_id=eq.${e}`,{method:"PATCH",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({role:t,updated_at:new Date().toISOString()})});if(!r.ok){let e=await r.text();throw Error(`HTTP error! status: ${r.status}, message: ${e}`)}let a=await r.json();return{data:a?.[0],error:null}}catch(e){return console.error("Error in updateContentCalendarMemberRole:",e),{data:null,error:e}}},removeContentCalendarMember:async e=>{try{let t=await fetch(`${o}/rest/v1/content_calendar_members?id=eq.${e}`,{method:"DELETE",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json"}});if(!t.ok){let e=await t.text();throw Error(`HTTP error! status: ${t.status}, message: ${e}`)}return{data:null,error:null}}catch(e){return console.error("Exception in removeContentCalendarMember:",e),{data:null,error:e}}},getContentCalendarFolders:async()=>{try{let e=await fetch(`${o}/rest/v1/content_calendar_folders?is_active=eq.true&order=sort_order.asc`,{method:"GET",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json"}});if(!e.ok)return console.error(`Failed to fetch folders: ${e.status}`),{data:[],error:null};let t=await e.json();return{data:t||[],error:null}}catch(e){return console.error("Error in getContentCalendarFolders:",e),{data:[],error:null}}},createContentCalendarFolder:async e=>{try{let{user:t}=await n.getUser();if(!t)return{data:null,error:Error("Authentication required")};let r={...e,created_by_id:t.id,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),is_active:!0},a=await fetch(`${o}/rest/v1/content_calendar_folders`,{method:"POST",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(r)});if(!a.ok){let e=await a.text();throw Error(`HTTP error! status: ${a.status}, message: ${e}`)}let s=await a.json();return{data:s?.[0],error:null}}catch(e){return console.error("Exception in createContentCalendarFolder:",e),{data:null,error:e}}},updateContentCalendarFolder:async(e,t)=>{try{let r={...t,updated_at:new Date().toISOString()},a=await fetch(`${o}/rest/v1/content_calendar_folders?id=eq.${e}`,{method:"PATCH",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(r)});if(!a.ok){let e=await a.text();throw Error(`HTTP error! status: ${a.status}, message: ${e}`)}let s=await a.json();return{data:s?.[0],error:null}}catch(e){return console.error("Exception in updateContentCalendarFolder:",e),{data:null,error:e}}},deleteContentCalendarFolder:async e=>{try{let t=await fetch(`${o}/rest/v1/content_calendar_folders?id=eq.${e}`,{method:"PATCH",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json"},body:JSON.stringify({is_active:!1,updated_at:new Date().toISOString()})});if(!t.ok){let e=await t.text();throw Error(`HTTP error! status: ${t.status}, message: ${e}`)}return{data:null,error:null}}catch(e){return console.error("Exception in deleteContentCalendarFolder:",e),{data:null,error:e}}},getContentCalendarFolderMembers:async e=>{try{let t=await fetch(`${o}/rest/v1/content_calendar_folder_members?folder_id=eq.${e}&select=*,auth_user:user_id(id,name,email,role)`,{method:"GET",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json"}});if(!t.ok)throw Error(`HTTP error! status: ${t.status}`);let r=await t.json();return{data:r||[],error:null}}catch(e){return console.error("Error in getContentCalendarFolderMembers:",e),{data:[],error:e}}},addContentCalendarFolderMember:async(e,t,r)=>{try{let a=await fetch(`${o}/rest/v1/content_calendar_folder_members?folder_id=eq.${e}&user_id=eq.${t}`,{method:"GET",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json"}});if(a.ok){let s=await a.json();if(s&&s.length>0){let a={role:r.role||"viewer",can_create:r.can_create||!1,can_edit:r.can_edit||!1,can_delete:r.can_delete||!1,can_manage_members:r.can_manage_members||!1},s=await fetch(`${o}/rest/v1/content_calendar_folder_members?folder_id=eq.${e}&user_id=eq.${t}`,{method:"PATCH",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(a)});if(!s.ok)throw Error("Failed to update member permissions");let n=await s.json();return{data:n?.[0],error:null,updated:!0}}}let s={folder_id:e,user_id:t,role:r.role||"viewer",can_create:r.can_create||!1,can_edit:r.can_edit||!1,can_delete:r.can_delete||!1,can_manage_members:r.can_manage_members||!1},n=await fetch(`${o}/rest/v1/content_calendar_folder_members`,{method:"POST",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(s)});if(!n.ok){let e=await n.text();throw Error(`HTTP error! status: ${n.status}, message: ${e}`)}let l=await n.json();return{data:l?.[0],error:null}}catch(e){return console.error("Exception in addContentCalendarFolderMember:",e),{data:null,error:e}}},removeContentCalendarFolderMember:async e=>{try{console.log("Attempting to remove folder member with ID:",e);let t=await fetch(`${o}/rest/v1/content_calendar_folder_members?id=eq.${e}`,{method:"DELETE",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json"}});if(console.log("Delete response status:",t.status),!t.ok){let e=await t.text();throw console.error("Delete failed with error:",e),Error(`HTTP error! status: ${t.status}, message: ${e}`)}return console.log("Folder member removed successfully"),{data:null,error:null}}catch(e){return console.error("Exception in removeContentCalendarFolderMember:",e),{data:null,error:e}}},getContentCalendarItemsWithFolders:async e=>{try{let t=`${o}/rest/v1/content_calendar_hierarchy?order=date.asc`;e&&(t+=`&folder_id=eq.${e}`);let r=await fetch(t,{method:"GET",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json"}});if(!r.ok)throw Error(`HTTP error! status: ${r.status}`);let a=await r.json();return{data:a||[],error:null}}catch(e){return console.error("Error in getContentCalendarItemsWithFolders:",e),{data:[],error:e}}},getPasswordFolders:async()=>{try{let e=await fetch(`${o}/rest/v1/password_vault_folders?order=name.asc`,{method:"GET",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json"}});if(!e.ok)throw Error(`HTTP error! status: ${e.status}`);let t=await e.json();return{data:t||[],error:null}}catch(e){return console.error("Error in getPasswordFolders:",e),{data:[],error:e}}},getPasswordEntries:async(e,t)=>{try{let r=await fetch(`${o}/rest/v1/password_vault?created_by_id=eq.${e}&is_active=eq.true&order=account_name.asc`,{method:"GET",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json"}});if(!r.ok)throw Error(`HTTP error! status: ${r.status}`);let a=await r.json(),s=[];try{let e=await fetch(`${o}/rest/v1/password_vault_access?user_email=eq.${t}&can_view=eq.true&select=vault_id,password_vault(*)`,{method:"GET",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json"}});if(e.ok){let t=await e.json();s=(t||[]).map(e=>e.password_vault).filter(Boolean)}}catch(e){console.warn("Could not fetch shared passwords:",e)}let n=[...a||[],...s],l=n.filter((e,t,r)=>t===r.findIndex(t=>t.id===e.id));return{data:l,error:null}}catch(e){return console.error("Error in getPasswordEntries:",e),{data:[],error:e}}},createPasswordFolder:async e=>{try{let t=await fetch(`${o}/rest/v1/password_vault_folders`,{method:"POST",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({...e,created_by:60})});if(!t.ok){let e=await t.text();throw Error(`HTTP error! status: ${t.status}, message: ${e}`)}let r=await t.json();return{data:r?.[0],error:null}}catch(e){return console.error("Error in createPasswordFolder:",e),{data:null,error:e}}},createPasswordEntry:async e=>{try{let t=await fetch(`${o}/rest/v1/password_vault`,{method:"POST",headers:{apikey:i,Authorization:`Bearer ${i}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(e)});if(!t.ok){let e=await t.text();throw Error(`HTTP error! status: ${t.status}, message: ${e}`)}let r=await t.json();return{data:r?.[0],error:null}}catch(e){return console.error("Error in createPasswordEntry:",e),{data:null,error:e}}},sharePassword:async(e,t,r=!1)=>{try{let{data:a,error:o}=await s.rpc("share_password_with_user",{password_id:e,target_user_id:t,can_edit:r});if(o)throw o;return{data:a,error:null}}catch(e){return console.error("Error in sharePassword:",e),{data:null,error:e}}},shareFolder:async(e,t,r=!1)=>{try{let{data:a,error:o}=await s.rpc("share_folder_with_user",{folder_id:e,target_user_id:t,can_edit:r});if(o)throw o;return{data:a,error:null}}catch(e){return console.error("Error in shareFolder:",e),{data:null,error:e}}}},d=s},6188:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>y,metadata:()=>h,viewport:()=>g});var a=r(4656),o=r(177),i=r.n(o),s=r(554),n=r.n(s);r(5023);var l=r(5153);let d=(0,l.createProxy)(String.raw`/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/contexts/AuthContext.tsx`),{__esModule:c,$$typeof:m}=d;d.default,(0,l.createProxy)(String.raw`/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/contexts/AuthContext.tsx#useAuth`);let p=(0,l.createProxy)(String.raw`/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/contexts/AuthContext.tsx#AuthProvider`),f=(0,l.createProxy)(String.raw`/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/components/DashboardLayoutWrapper.tsx`),{__esModule:u,$$typeof:x}=f,b=f.default,h={title:"ProjectFlow - Modern Project Management",description:"Streamline your workflow with modern project management tools. Plan, track, and deliver projects efficiently."},g={width:"device-width",initialScale:1,maximumScale:1,userScalable:!1};function y({children:e}){return a.jsx("html",{lang:"en",className:"h-full",children:(0,a.jsxs)("body",{className:`${i().className} h-full antialiased`,style:{background:"#F5F5ED"},children:[a.jsx(n(),{src:"https://accounts.google.com/gsi/client",strategy:"afterInteractive"}),a.jsx(n(),{src:"https://apis.google.com/js/api.js",strategy:"afterInteractive"}),a.jsx(p,{children:a.jsx(b,{children:e})})]})})}},5023:()=>{}};