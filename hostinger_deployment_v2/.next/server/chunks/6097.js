"use strict";exports.id=6097,exports.ids=[6097],exports.modules={9077:(e,a,r)=>{r.d(a,{Z:()=>q});var t=r(3854),o=r(887),s=r.n(o),i=r(4218);r(3638);var n=r(5548),l=r.n(n),c=r(1018),d=r(6837),f=r(2132);function m(){let{user:e}=(0,d.useAuth)(),[a,r]=(0,i.useState)([]),[o,s]=(0,i.useState)(0),[n,l]=(0,i.useState)(!1),[c,m]=(0,i.useState)(!1),x=(0,i.useRef)(null);(0,i.useEffect)(()=>{let e=e=>{x.current&&!x.current.contains(e.target)&&l(!1)};return document.addEventListener("mousedown",e),()=>document.removeEventListener("mousedown",e)},[]);let p=async()=>{if(e?.id)try{m(!0);let{data:a,error:t}=await f.supabase.from("notifications").select("*").eq("recipient_id",e.id).order("created_at",{ascending:!1}).limit(20);if(t)throw t;r(a||[]),s(a?.filter(e=>!e.is_read).length||0)}catch(e){console.error("Failed to fetch notifications:",e)}finally{m(!1)}},b=async e=>{try{let{error:t}=await f.supabase.from("notifications").update({is_read:!0}).eq("id",e);if(t)throw t;r(a.map(a=>a.id===e?{...a,is_read:!0}:a)),s(e=>Math.max(0,e-1))}catch(e){console.error("Failed to mark notification as read:",e)}},u=async()=>{if(e?.id)try{let{error:t}=await f.supabase.from("notifications").update({is_read:!0}).eq("recipient_id",e.id).eq("is_read",!1);if(t)throw t;r(a.map(e=>({...e,is_read:!0}))),s(0)}catch(e){console.error("Failed to mark all notifications as read:",e)}},g=async e=>{e.is_read||await b(e.id),e.data?.task_url?window.location.href=e.data.task_url:e.data?.project_url&&(window.location.href=e.data.project_url)},h=e=>{switch(e){case"task_assigned":return t.jsx("div",{className:"w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center",children:t.jsx("svg",{className:"w-4 h-4 text-blue-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:t.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"})})});case"task_reminder":return t.jsx("div",{className:"w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center",children:t.jsx("svg",{className:"w-4 h-4 text-yellow-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:t.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"})})});case"task_status_changed":return t.jsx("div",{className:"w-8 h-8 bg-green-100 rounded-full flex items-center justify-center",children:t.jsx("svg",{className:"w-4 h-4 text-green-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:t.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"})})});default:return t.jsx("div",{className:"w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center",children:t.jsx("svg",{className:"w-4 h-4 text-gray-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:t.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})})})}},j=e=>{let a=new Date(e),r=new Date,t=r.getTime()-a.getTime(),o=Math.floor(t/36e5),s=Math.floor(o/24);if(o<1){let e=Math.floor(t/6e4);return e<1?"Just now":`${e}m ago`}return o<24?`${o}h ago`:s<7?`${s}d ago`:a.toLocaleDateString()};return((0,i.useEffect)(()=>{e?.id&&p()},[e?.id]),(0,i.useEffect)(()=>{if(!e?.id)return;let a=f.supabase.channel("notifications").on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`recipient_id=eq.${e.id}`},e=>{let a=e.new;r(e=>[a,...e]),s(e=>e+1)}).subscribe();return()=>{f.supabase.removeChannel(a)}},[e?.id]),e)?(0,t.jsxs)("div",{className:"relative",ref:x,children:[(0,t.jsxs)("button",{onClick:()=>l(!n),className:"relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200","aria-label":"Notifications",children:[t.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:t.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M15 17h5l-5 5v-5zM12 2a7 7 0 00-7 7v4l-2 2v1h18v-1l-2-2V9a7 7 0 00-7-7z"})}),o>0&&t.jsx("span",{className:"absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium",children:o>9?"9+":o})]}),n&&(0,t.jsxs)("div",{className:"absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden",children:[(0,t.jsxs)("div",{className:"px-4 py-3 border-b border-gray-200 flex items-center justify-between",children:[t.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:"Notifications"}),o>0&&t.jsx("button",{onClick:u,className:"text-sm text-blue-600 hover:text-blue-800 font-medium",children:"Mark all read"})]}),t.jsx("div",{className:"max-h-80 overflow-y-auto",children:c?(0,t.jsxs)("div",{className:"p-4 text-center text-gray-500",children:[t.jsx("div",{className:"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"}),t.jsx("p",{className:"mt-2 text-sm",children:"Loading notifications..."})]}):0===a.length?(0,t.jsxs)("div",{className:"p-8 text-center text-gray-500",children:[t.jsx("svg",{className:"w-12 h-12 mx-auto mb-4 text-gray-300",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:t.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:1,d:"M15 17h5l-5 5v-5zM12 2a7 7 0 00-7 7v4l-2 2v1h18v-1l-2-2V9a7 7 0 00-7-7z"})}),t.jsx("p",{className:"text-sm",children:"No notifications yet"}),t.jsx("p",{className:"text-xs text-gray-400 mt-1",children:"You'll see updates about your tasks here"})]}):a.map(e=>t.jsx("div",{onClick:()=>g(e),className:`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${e.is_read?"":"bg-blue-50"}`,children:(0,t.jsxs)("div",{className:"flex items-start space-x-3",children:[h(e.type),(0,t.jsxs)("div",{className:"flex-1 min-w-0",children:[t.jsx("p",{className:`text-sm font-medium text-gray-900 ${e.is_read?"":"font-semibold"}`,children:e.title}),t.jsx("p",{className:"text-sm text-gray-600 mt-1 line-clamp-2",children:e.message}),t.jsx("p",{className:"text-xs text-gray-400 mt-2",children:j(e.created_at)})]}),!e.is_read&&t.jsx("div",{className:"w-2 h-2 bg-blue-600 rounded-full mt-2"})]})},e.id))}),a.length>0&&t.jsx("div",{className:"px-4 py-3 border-t border-gray-200 bg-gray-50",children:t.jsx("a",{href:"/inbox",className:"text-sm text-blue-600 hover:text-blue-800 font-medium",onClick:()=>l(!1),children:"View all notifications"})})]})]}):null}var x=r(900),p=r(199),b=r(2075),u=r(7121),g=r(4358),h=r(4063),j=r(9618),y=r(2637),w=r(5908),v=r(4791),k=r(30),N=r(7375),z=r(2376),D=r(9072),_=r(2730),C=r(5388),F=r(3768),S=r(6965),T=r(6835),A=r(9374),I=r(8998),E=r(3882),P=r(8041),M=r(9329);function q({projects:e,onCreateProject:a}){let o=(0,c.useRouter)(),n=(0,c.usePathname)(),{user:f,logout:q}=(0,d.useAuth)(),[L,R]=(0,i.useState)(!0),[B,Z]=(0,i.useState)(!1),[$,O]=(0,i.useState)(!1),[Y,U]=(0,i.useState)(!1),[H,W]=(0,i.useState)(!1),[X,G]=(0,i.useState)(!1),[K,V]=(0,i.useState)(!1),[J,Q]=(0,i.useState)(!1),[ee,ea]=(0,i.useState)(!1),[er,et]=(0,i.useState)({startDate:"",endDate:"",reason:"",leaveType:"vacation",notes:"",projectId:0}),[eo,es]=(0,i.useState)(14),[ei,en]=(0,i.useState)(0),el=async()=>{if(!f?.id){G(!1);return}try{let e=(await Promise.resolve().then(r.bind(r,2132))).supabase;console.log("\uD83D\uDD0D Checking Class Schedule access for user:",f.id,f.email);let{data:a,error:t}=await e.from("class_schedule_members").select("id, role").eq("user_id",f.id).single();if(console.log("\uD83D\uDCCB Class Schedule member check:",{memberData:a,memberError:t}),a&&!t){console.log("✅ Class Schedule access granted: User is a member"),G(!0);return}let{data:o,error:s}=await e.from("auth_user").select("id, name, email, role, is_superuser, is_staff").eq("id",f.id).single();if(console.log("\uD83D\uDC64 User data check:",o),s){console.log("❌ Class Schedule access denied: User data error"),G(!1);return}let i=o.is_superuser||o.is_staff||"admin"===o.role||"hr"===o.role;console.log("\uD83D\uDD10 Class Schedule admin/HR check:",{is_superuser:o.is_superuser,is_staff:o.is_staff,role:o.role,hasPermission:i}),G(i)}catch(e){console.error("Error checking class schedule access:",e),G(!1)}},ec=async()=>{if(!f?.id){V(!1);return}try{let e=(await Promise.resolve().then(r.bind(r,2132))).supabase;console.log("\uD83D\uDD0D Checking Content Calendar access for user:",f.id,f.email);let{data:a,error:t}=await e.from("content_calendar_members").select("id, role").eq("user_id",f.id).single();if(console.log("\uD83D\uDCCB Content Calendar member check:",{memberData:a,memberError:t}),a&&!t){console.log("✅ Content Calendar access granted: User is a member"),V(!0);return}let{data:o,error:s}=await e.from("content_calendar_folder_members").select("id, role").eq("user_id",f.id).limit(1);if(console.log("\uD83D\uDCC1 Folder member check:",{folderMemberData:o,folderMemberError:s}),o&&o.length>0&&!s){console.log("✅ Content Calendar access granted: User is a folder member"),V(!0);return}let{data:i,error:n}=await e.from("auth_user").select("id, name, email, role, is_superuser, is_staff").eq("id",f.id).single();if(console.log("\uD83D\uDC64 User data check:",i),n){console.log("❌ Content Calendar access denied: User data error"),V(!1);return}let l=i.is_superuser||i.is_staff||"admin"===i.role||"hr"===i.role;console.log("\uD83D\uDD10 Content Calendar admin/HR check:",{is_superuser:i.is_superuser,is_staff:i.is_staff,role:i.role,hasPermission:l}),l?(console.log("✅ Content Calendar access granted: User is admin/HR"),V(!0)):(console.log("❌ Content Calendar access denied: No access found"),V(!1))}catch(e){console.error("Error checking content calendar access:",e),V(!1)}},ed=async()=>{if(!f?.id){Q(!1);return}try{let e=(await Promise.resolve().then(r.bind(r,2132))).supabase;console.log("\uD83D\uDD0D Checking Classes access for user:",f.id,f.email);let{data:a,error:t}=await e.from("classes_members").select("id, role").eq("user_id",f.id).single();if(console.log("\uD83D\uDCCB Classes member check:",{memberData:a,memberError:t}),a&&!t){console.log("✅ Classes access granted: User is a member"),Q(!0);return}let{data:o,error:s}=await e.from("auth_user").select("id, name, email, role, is_superuser, is_staff").eq("id",f.id).single();if(console.log("\uD83D\uDC64 Classes user data check:",o),s){console.log("❌ Classes access denied: User data error"),Q(!1);return}let i=o.is_superuser||o.is_staff||"admin"===o.role||"hr"===o.role;console.log("\uD83D\uDD10 Classes admin/HR check:",{is_superuser:o.is_superuser,is_staff:o.is_staff,role:o.role,hasPermission:i}),Q(i)}catch(e){console.error("Error checking classes access:",e),Q(!1)}},ef=async()=>{if(!f?.id){ea(!1);return}try{let e=(await Promise.resolve().then(r.bind(r,2132))).supabase;console.log("\uD83D\uDD0D Checking Company Outreach access for user:",f.id,f.email,f);let a=f.role||f?.user_metadata?.role;if("instructor"===a){console.log("❌ Company Outreach access denied: User is instructor (restricted)"),ea(!1);return}let{data:t,error:o}=await e.from("company_outreach_members").select("id, role").eq("user_id",f.id).single();if(console.log("\uD83D\uDCCB Company Outreach member check:",{memberData:t,memberError:o}),t&&!o){console.log("✅ Company Outreach access granted: User is a member"),ea(!0);return}let s="admin"===a||"hr"===a||"superuser"===a;if(console.log("\uD83D\uDD0D Auth context check:",{contextRole:a,isAdmin:s,userRole:f.role,userMetadata:f?.user_metadata}),s){console.log("✅ Company Outreach access granted: Admin from context"),ea(!0);return}let{data:i,error:n}=await e.from("auth_user").select("id, name, email, role, is_superuser, is_staff").eq("id",f.id).single();if(console.log("\uD83D\uDC64 Company Outreach database user check:",i,n),!n&&i){if("instructor"===i.role){console.log("❌ Company Outreach access denied: Database role is instructor"),ea(!1);return}let e=i.is_superuser||i.is_staff||"admin"===i.role||"hr"===i.role;if(console.log("\uD83D\uDD10 Company Outreach admin/HR check:",{is_superuser:i.is_superuser,is_staff:i.is_staff,role:i.role,hasAdminPermission:e}),e){console.log("✅ Company Outreach access granted: Admin from database"),ea(!0);return}}console.log("❌ Company Outreach access denied: User not in member table and not admin"),ea(!1)}catch(e){console.error("Error checking company outreach access:",e),ea(!1)}},em=async()=>{if(f?.id)try{let e=(await Promise.resolve().then(r.bind(r,2132))).supabase,{data:a,error:t}=await e.from("employee_leave_balance").select("available_days, used_days, total_days").eq("employee_id",f.id).single();t?(console.log("No leave balance record found, using defaults"),es(14),en(0)):(es(a.available_days||14),en(a.used_days||0))}catch(e){console.error("Error fetching leave balance:",e),es(14),en(0)}};(0,i.useEffect)(()=>{f?.id?(em(),el(),ec(),ed(),ef()):(G(!1),V(!1),Q(!1),ea(!1))},[f?.id]);let ex=(0,i.useRef)(null),[ep,eb]=(0,i.useState)(!1),[eu,eg]=(0,i.useState)({projectId:0,reportDate:new Date().toISOString().split("T")[0],dateDisplay:"",keyActivities:[""],ongoingTasks:[""],challenges:[""],teamPerformance:[""],nextDayPriorities:[""],meetingMinutes:"",hasMeetingMinutes:!1,otherNotes:""}),[eh,ej]=(0,i.useState)(!1),[ey,ew]=(0,i.useState)([]),[ev,ek]=(0,i.useState)(0),[eN,ez]=(0,i.useState)(!1),eD=async()=>{try{await q(),o.push("/login")}catch(e){console.error("Logout failed:",e)}},e_=()=>{Z(!1),O(!1)},eC=()=>{console.log("\uD83D\uDD25 DEBUG: Toggle dropdown clicked! Current state:",$),O(!$),console.log("\uD83D\uDD25 DEBUG: Setting dropdown state to:",!$)},eF=()=>{O(!1)},eS=async a=>{a.preventDefault();let t=new Date(er.startDate),o=new Date(er.endDate),s=o.getTime()-t.getTime(),i=Math.ceil(s/864e5)+1;if(i>eo){alert(`You only have ${eo} days available. You requested ${i} days.`);return}try{if(!f?.id){alert("User not found. Please log in again.");return}let a=e.find(e=>e.id===er.projectId),s={start_date:er.startDate,end_date:er.endDate,leave_type:er.leaveType,reason:er.reason,notes:er.notes||"",project_id:er.projectId||null,project_name:a?.name||null};console.log("Submitting leave request:",s),console.log("Auth token exists:",!!localStorage.getItem("accessToken")),console.log("Auth token:",localStorage.getItem("accessToken")?.substring(0,50)+"..."),console.log("User data:",f),console.log("Request headers:",{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("accessToken")}`});let n=(await Promise.resolve().then(r.bind(r,2132))).supabase,{data:l,error:c}=await n.from("leave_requests").insert([{employee_id:f.id,employee_name:f.name||f.email?.split("@")[0]||"Unknown",employee_email:f.email,project_id:s.project_id,project_name:s.project_name,start_date:s.start_date,end_date:s.end_date,leave_type:s.leave_type,reason:s.reason,notes:s.notes,days_requested:i,status:"pending"}]).select();if(c)throw console.error("Error submitting leave request:",c),Error(c.message||"Failed to submit leave request");et({startDate:"",endDate:"",reason:"",leaveType:"vacation",notes:"",projectId:0}),W(!1);try{let{data:e,error:a}=await n.from("auth_user").select("id, first_name, last_name, email").or("is_staff.eq.true,is_superuser.eq.true");if(!a&&e&&e.length>0){let a=e.map(e=>({recipient_id:e.id,sender_id:f.id,type:"leave_request_submitted",title:"New Leave Request",message:`${f.name||f.email?.split("@")[0]} has submitted a ${i}-day leave request for ${t.toLocaleDateString()} - ${o.toLocaleDateString()}`,data:{leave_request_id:l[0]?.id,employee_name:f.name||f.email?.split("@")[0],employee_email:f.email,days:i,start_date:er.startDate,end_date:er.endDate,leave_type:er.leaveType}})),{error:r}=await n.from("notifications").insert(a);r&&console.error("Error creating HR notifications:",r)}}catch(e){console.error("Error notifying HR users:",e)}await em(),alert(`Leave request submitted successfully! 
        
Your request for ${i} days has been sent to HR for approval.
        
Status: Pending Approval
Days Requested: ${i}
Period: ${t.toLocaleDateString()} - ${o.toLocaleDateString()}

You will be notified once HR reviews your request.`)}catch(e){console.error("Error submitting leave request:",e),alert("Failed to submit leave request. Please try again.")}},eT=()=>{W(!1),et({startDate:"",endDate:"",reason:"",leaveType:"vacation",notes:"",projectId:0})},eA=()=>{if(!er.startDate||!er.endDate)return 0;let e=new Date(er.startDate),a=new Date(er.endDate);if(a<e)return 0;let r=a.getTime()-e.getTime();return Math.ceil(r/864e5)+1},eI=async a=>{a.preventDefault();let t=eu.keyActivities.filter(e=>e.trim()).join("\n• ");if(!t||!eu.projectId){alert("Please fill in the required fields: Key Activities and Project.");return}try{if(!f?.id){alert("User not found. Please log in again.");return}let a=e.find(e=>e.id===eu.projectId),o=(await Promise.resolve().then(r.bind(r,2132))).supabase,s=e=>{let a=e.filter(e=>e.trim());return a.length>0?"• "+a.join("\n• "):null},{data:i,error:n}=await o.from("daily_reports").insert([{employee_id:f.id,employee_name:f.name||f.email?.split("@")[0]||"Unknown",employee_email:f.email,project_id:eu.projectId,project_name:a?.name||null,report_date:eu.reportDate,date_display:eu.dateDisplay,key_activities:s(eu.keyActivities),ongoing_tasks:s(eu.ongoingTasks),challenges:s(eu.challenges),team_performance:s(eu.teamPerformance),next_day_priorities:s(eu.nextDayPriorities),meeting_minutes:eu.meetingMinutes.trim()||null,has_meeting_minutes:eu.hasMeetingMinutes,other_notes:eu.otherNotes.trim()||null}]).select();if(n){if(console.error("Error submitting daily report:",n),"23505"===n.code)alert("You have already submitted a daily report for this date and project. Please edit the existing report or choose a different project.");else throw Error(n.message||"Failed to submit daily report")}else eg({projectId:0,reportDate:new Date().toISOString().split("T")[0],dateDisplay:"",keyActivities:[""],ongoingTasks:[""],challenges:[""],teamPerformance:[""],nextDayPriorities:[""],meetingMinutes:"",hasMeetingMinutes:!1,otherNotes:""}),eb(!1),alert(`Daily report submitted successfully! 
        
Your report for ${eu.dateDisplay} has been saved.

Project: ${a?.name||"Unknown"}
Key Activities: ${t.substring(0,100)}${t.length>100?"...":""}

Your report is now available in the system.`)}catch(e){console.error("Error submitting daily report:",e),alert("Failed to submit daily report. Please try again.")}},eE=()=>{eb(!1),eg({projectId:0,reportDate:new Date().toISOString().split("T")[0],dateDisplay:"",keyActivities:[""],ongoingTasks:[""],challenges:[""],teamPerformance:[""],nextDayPriorities:[""],meetingMinutes:"",hasMeetingMinutes:!1,otherNotes:""})},eP=e=>{eg(a=>({...a,[e]:[...a[e],""]}))},eM=(e,a)=>{eg(r=>{let t=r[e];if(t.length>1){let o=t.filter((e,r)=>r!==a);return{...r,[e]:o}}return r})},eq=(e,a,r)=>{eg(t=>{let o=[...t[e]];return o[a]=r,{...t,[e]:o}})},eL=async()=>{if(f?.id)try{let e=(await Promise.resolve().then(r.bind(r,2132))).supabase,{count:a,error:t}=await e.from("notifications").select("*",{count:"exact",head:!0}).eq("recipient_id",f.id).eq("is_read",!1);t?(console.error("Error fetching unread count:",t),ek(0)):ek(a||0)}catch(e){console.error("Error fetching unread count:",e),ek(0)}},eR=async e=>{try{let a=(await Promise.resolve().then(r.bind(r,2132))).supabase,{error:t}=await a.from("notifications").update({is_read:!0}).eq("id",e);t?console.error("Error marking notification as read:",t):(ew(ey.map(a=>a.id===e?{...a,is_read:!0}:a)),eL())}catch(e){console.error("Error marking notification as read:",e)}},eB=e=>{switch(e){case"leave_request":return t.jsx(x.Z,{style:{width:"16px",height:"16px",color:"#f59e0b"}});case"leave_status_update":return t.jsx(p.Z,{style:{width:"16px",height:"16px",color:"#10b981"}});default:return t.jsx(b.Z,{style:{width:"16px",height:"16px",color:"#6b7280"}})}},eZ=e=>{let a=new Date(e),r=new Date,t=(r.getTime()-a.getTime())/36e5;return t<1?"Just now":t<24?`${Math.floor(t)}h ago`:a.toLocaleDateString()};(0,i.useEffect)(()=>{if(f?.id){let e=async()=>{await eL()};e();let a=setInterval(eL,3e4);return()=>clearInterval(a)}},[f?.id]),(0,i.useEffect)(()=>{let e=e=>{let a=e.target,r=ex.current&&!ex.current.contains(a),t=!a.closest||!a.closest("[data-dropdown-portal]");r&&t&&(console.log("\uD83D\uDD25 DEBUG: Closing dropdown due to outside click"),O(!1))};return $&&document.addEventListener("mousedown",e),()=>{document.removeEventListener("mousedown",e)}},[$]);let e$=[{name:"Home",href:"/dashboard",icon:u.Z},{name:"My Tasks",href:"/my-tasks",icon:g.Z},{name:"Calendar",href:"/calendar",icon:h.Z},{name:"My Personal",href:"/personal",icon:j.Z},{name:"Expenses",href:"/expenses",icon:y.Z},{name:"Password Vault",href:"/password-vault",icon:w.Z},{name:"Timetable",href:"/timetable",icon:v.Z},{name:"Reporting",href:"/reporting",icon:k.Z}],eO=[...e$,{name:"Content Calendar",href:"/content-calendar",icon:N.Z},...X?[{name:"Class Schedule",href:"/class-schedule",icon:z.Z}]:[],...J?[{name:"Classes",href:"/classes",icon:D.Z}]:[]],eY=[...ee?[{name:"Company Outreach",href:"/company-outreach",icon:_.Z}]:[]],eU=f?.role==="admin"||f?.user_metadata?.role==="admin",eH=eU?[{name:"Admin",href:"/admin",icon:C.Z}]:[],eW=f?.role==="instructor"||f?.user_metadata?.role==="instructor",eX=eW?[{name:"Instructor",href:"/instructor",icon:z.Z}]:[],eG=eW?[{name:"Home",href:"/dashboard",icon:u.Z},{name:"My Tasks",href:"/my-tasks",icon:g.Z},{name:"Calendar",href:"/calendar",icon:h.Z},{name:"Timetable",href:"/timetable",icon:v.Z}]:eO,eK=[{name:"Inbox",href:"/inbox",icon:F.Z},{name:"Daily Reports",href:"/daily-reports",icon:S.Z},{name:"Expenses",href:"/expenses",icon:y.Z},{name:"Absence Management",href:"/employee-absent",icon:j.Z}];F.Z;let eV=e=>"/dashboard"===e?n===e:n?.startsWith(e);return(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1",children:[t.jsx("style",{dangerouslySetInnerHTML:{__html:`
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
        `}}),t.jsx("button",{onClick:()=>{Z(!B)},className:"jsx-79e4f0e0f941e9c1 mobile-menu-button",children:B?t.jsx(T.Z,{style:{width:"24px",height:"24px"}}):t.jsx(A.Z,{style:{width:"24px",height:"24px"}})}),t.jsx("div",{onClick:e_,className:`jsx-79e4f0e0f941e9c1 mobile-overlay ${B?"show":""}`}),(0,t.jsxs)("div",{className:`jsx-79e4f0e0f941e9c1 sidebar ${B?"open":""} ${Y?"collapsed":""}`,children:[t.jsx("div",{className:"jsx-79e4f0e0f941e9c1 sidebar-header",children:(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 sidebar-header-content",children:[t.jsx("button",{onClick:()=>{U(!Y),eF(),setTimeout(()=>{let e=document.querySelectorAll('[style*="marginLeft: 256px"]');e.forEach(e=>{e.style.marginLeft&&(e.style.marginLeft=Y?"256px":"64px")})},0)},title:Y?"Expand sidebar":"Collapse sidebar",className:"jsx-79e4f0e0f941e9c1 sidebar-toggle",children:t.jsx(A.Z,{style:{width:"20px",height:"20px"}})}),t.jsx("h1",{className:"jsx-79e4f0e0f941e9c1 sidebar-title",children:"Projects"}),(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem"},className:"jsx-79e4f0e0f941e9c1",children:[t.jsx(m,{}),t.jsx("div",{ref:ex,className:"jsx-79e4f0e0f941e9c1 sidebar-add-container",children:t.jsx("button",{onClick:e=>{console.log("\uD83D\uDD25 DEBUG: Plus (+) button clicked!",e),e.preventDefault(),e.stopPropagation(),eC()},title:"Create new...",className:`jsx-79e4f0e0f941e9c1 sidebar-add-btn ${$?"active":""}`,children:t.jsx(I.Z,{style:{width:"20px",height:"20px"}})})})]})]})}),(0,t.jsxs)("nav",{className:"jsx-79e4f0e0f941e9c1 sidebar-nav",children:[(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 nav-section",children:[(eW?eG:eO).map(e=>(0,t.jsxs)(l(),{href:e.href,className:`nav-item ${eV(e.href)?"active":""}`,onClick:e_,children:[t.jsx(e.icon,{className:"nav-icon"}),t.jsx("span",{className:"jsx-79e4f0e0f941e9c1 nav-text",children:e.name})]},e.name)),eW||f?.role!=="hr"&&f?.role!=="admin"&&f?.user_metadata?.role!=="hr"&&f?.user_metadata?.role!=="admin"?!eW&&(0,t.jsxs)(t.Fragment,{children:[t.jsx("div",{style:{borderTop:"1px solid #e5e7eb",margin:"1rem 0 0.5rem 0",paddingTop:"0.5rem"},className:"jsx-79e4f0e0f941e9c1 nav-section-header",children:t.jsx("span",{style:{fontSize:"0.75rem",color:"#666666",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.05em",paddingLeft:"0.75rem"},className:"jsx-79e4f0e0f941e9c1",children:"Personal"})}),eK.slice(0,2).map(e=>(0,t.jsxs)(l(),{href:e.href,className:`nav-item ${eV(e.href)?"active":""}`,onClick:e_,children:[t.jsx(e.icon,{className:"nav-icon"}),t.jsx("span",{className:"jsx-79e4f0e0f941e9c1 nav-text",children:e.name})]},e.name))]}):(0,t.jsxs)(t.Fragment,{children:[t.jsx("div",{style:{borderTop:"1px solid #e5e7eb",margin:"1rem 0 0.5rem 0",paddingTop:"0.5rem"},className:"jsx-79e4f0e0f941e9c1 nav-section-header",children:t.jsx("span",{style:{fontSize:"0.75rem",color:"#666666",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.05em",paddingLeft:"0.75rem"},className:"jsx-79e4f0e0f941e9c1",children:"HR Tools"})}),eK.map(e=>(0,t.jsxs)(l(),{href:e.href,className:`nav-item ${eV(e.href)?"active":""}`,onClick:e_,children:[t.jsx(e.icon,{className:"nav-icon"}),t.jsx("span",{className:"jsx-79e4f0e0f941e9c1 nav-text",children:e.name})]},e.name))]}),eY.length>0&&(0,t.jsxs)(t.Fragment,{children:[t.jsx("div",{style:{borderTop:"1px solid #e5e7eb",margin:"1rem 0 0.5rem 0",paddingTop:"0.5rem"},className:"jsx-79e4f0e0f941e9c1 nav-section-header",children:t.jsx("span",{style:{fontSize:"0.75rem",color:"#666666",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.05em",paddingLeft:"0.75rem"},className:"jsx-79e4f0e0f941e9c1",children:"Idea Lounge"})}),eY.map(e=>(0,t.jsxs)(l(),{href:e.href,className:`nav-item ${eV(e.href)?"active":""}`,onClick:e_,children:[t.jsx(e.icon,{className:"nav-icon"}),t.jsx("span",{className:"jsx-79e4f0e0f941e9c1 nav-text",children:e.name})]},e.name))]}),!eW&&eH.length>0&&(0,t.jsxs)(t.Fragment,{children:[t.jsx("div",{style:{borderTop:"1px solid #e5e7eb",margin:"1rem 0 0.5rem 0",paddingTop:"0.5rem"},className:"jsx-79e4f0e0f941e9c1 nav-section-header",children:t.jsx("span",{style:{fontSize:"0.75rem",color:"#666666",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.05em",paddingLeft:"0.75rem"},className:"jsx-79e4f0e0f941e9c1",children:"Admin"})}),eH.map(e=>(0,t.jsxs)(l(),{href:e.href,className:`nav-item ${eV(e.href)?"active":""}`,onClick:e_,children:[t.jsx(e.icon,{className:"nav-icon"}),t.jsx("span",{className:"jsx-79e4f0e0f941e9c1 nav-text",children:e.name})]},e.name))]}),eX.length>0&&(0,t.jsxs)(t.Fragment,{children:[t.jsx("div",{style:{borderTop:"1px solid #e5e7eb",margin:"1rem 0 0.5rem 0",paddingTop:"0.5rem"},className:"jsx-79e4f0e0f941e9c1 nav-section-header",children:t.jsx("span",{style:{fontSize:"0.75rem",color:"#666666",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.05em",paddingLeft:"0.75rem"},className:"jsx-79e4f0e0f941e9c1",children:"Instructor"})}),eX.map(e=>(0,t.jsxs)(l(),{href:e.href,className:`nav-item ${eV(e.href)?"active":""}`,onClick:e_,children:[t.jsx(e.icon,{className:"nav-icon"}),t.jsx("span",{className:"jsx-79e4f0e0f941e9c1 nav-text",children:e.name})]},e.name))]})]}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 nav-section",children:[(0,t.jsxs)("button",{onClick:()=>R(!L),className:"jsx-79e4f0e0f941e9c1 projects-toggle",children:[t.jsx("span",{className:"jsx-79e4f0e0f941e9c1 projects-toggle-text",children:"My Projects"}),t.jsx("span",{className:"jsx-79e4f0e0f941e9c1 projects-toggle-icon",children:L?t.jsx(E.Z,{style:{width:"16px",height:"16px"}}):t.jsx(P.Z,{style:{width:"16px",height:"16px"}})})]}),L&&t.jsx("div",{className:"jsx-79e4f0e0f941e9c1 projects-list",children:e.map(e=>(0,t.jsxs)(l(),{href:`/projects/${e.id}`,className:`project-item ${eV(`/projects/${e.id}`)?"active":""}`,onClick:e_,children:[(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 project-info",children:[t.jsx("div",{style:{backgroundColor:e.color||"#000000"},className:"jsx-79e4f0e0f941e9c1 project-color"}),t.jsx("span",{style:{wordWrap:"break-word",overflowWrap:"break-word",whiteSpace:"normal",lineHeight:"1.3"},className:"jsx-79e4f0e0f941e9c1 project-name",children:e.name})]}),(0,t.jsxs)("span",{className:"jsx-79e4f0e0f941e9c1 project-count",children:[e.completed_task_count||0,"/",e.task_count||0]})]},e.id))})]})]}),t.jsx("div",{className:"jsx-79e4f0e0f941e9c1 sidebar-footer",children:(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 user-profile",children:[t.jsx("div",{className:"jsx-79e4f0e0f941e9c1 user-avatar",children:t.jsx("span",{className:"jsx-79e4f0e0f941e9c1 user-avatar-text",children:f?.name?.charAt(0).toUpperCase()})}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 user-info",children:[t.jsx("p",{className:"jsx-79e4f0e0f941e9c1 user-name",children:f?.name}),t.jsx("p",{className:"jsx-79e4f0e0f941e9c1 user-email",children:f?.email})]}),t.jsx("button",{onClick:eD,title:"Sign out",className:"jsx-79e4f0e0f941e9c1 logout-btn",children:t.jsx(M.Z,{style:{width:"20px",height:"20px"}})})]})})]}),$&&(console.log("\uD83D\uDD25 DEBUG: Rendering dropdown portal, isDropdownOpen =",$),!0)&&!1,H&&(console.log("\uD83D\uDD25 DEBUG: Rendering Absence Form Modal, showAbsenceForm =",H),!0)&&t.jsx("div",{onClick:eT,className:"jsx-79e4f0e0f941e9c1 modal-overlay",children:(0,t.jsxs)("div",{onClick:e=>e.stopPropagation(),className:"jsx-79e4f0e0f941e9c1 modal-content",children:[(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 modal-header",children:[t.jsx("h2",{className:"jsx-79e4f0e0f941e9c1 modal-title",children:"Employee Leave Request"}),t.jsx("button",{onClick:eT,title:"Close",className:"jsx-79e4f0e0f941e9c1 modal-close-btn",children:t.jsx(T.Z,{style:{width:"24px",height:"24px"}})})]}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 modal-body",children:[(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 leave-stats",children:[(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 stat-card stat-available",children:[t.jsx("div",{className:"jsx-79e4f0e0f941e9c1 stat-number",children:eo}),t.jsx("div",{className:"jsx-79e4f0e0f941e9c1 stat-label",children:"Available Days"})]}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 stat-card stat-used",children:[t.jsx("div",{className:"jsx-79e4f0e0f941e9c1 stat-number",children:ei}),t.jsx("div",{className:"jsx-79e4f0e0f941e9c1 stat-label",children:"Used Days"})]}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 stat-card stat-requested",children:[t.jsx("div",{className:"jsx-79e4f0e0f941e9c1 stat-number",children:eA()}),t.jsx("div",{className:"jsx-79e4f0e0f941e9c1 stat-label",children:"Requested Days"})]})]}),(0,t.jsxs)("form",{onSubmit:eS,className:"jsx-79e4f0e0f941e9c1",children:[(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-grid",children:[(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group",children:[t.jsx("label",{className:"jsx-79e4f0e0f941e9c1 form-label",children:"Start Date"}),t.jsx("input",{type:"date",required:!0,value:er.startDate,onChange:e=>et({...er,startDate:e.target.value}),min:new Date().toISOString().split("T")[0],className:"jsx-79e4f0e0f941e9c1 form-input"})]}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group",children:[t.jsx("label",{className:"jsx-79e4f0e0f941e9c1 form-label",children:"End Date"}),t.jsx("input",{type:"date",required:!0,value:er.endDate,onChange:e=>et({...er,endDate:e.target.value}),min:er.startDate||new Date().toISOString().split("T")[0],className:"jsx-79e4f0e0f941e9c1 form-input"})]})]}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group",children:[t.jsx("label",{className:"jsx-79e4f0e0f941e9c1 form-label",children:"Leave Type"}),(0,t.jsxs)("select",{value:er.leaveType,onChange:e=>et({...er,leaveType:e.target.value}),className:"jsx-79e4f0e0f941e9c1 form-select",children:[t.jsx("option",{value:"vacation",className:"jsx-79e4f0e0f941e9c1",children:"Vacation"}),t.jsx("option",{value:"sick",className:"jsx-79e4f0e0f941e9c1",children:"Sick Leave"}),t.jsx("option",{value:"personal",className:"jsx-79e4f0e0f941e9c1",children:"Personal Leave"}),t.jsx("option",{value:"family",className:"jsx-79e4f0e0f941e9c1",children:"Family Emergency"}),t.jsx("option",{value:"medical",className:"jsx-79e4f0e0f941e9c1",children:"Medical Appointment"}),t.jsx("option",{value:"other",className:"jsx-79e4f0e0f941e9c1",children:"Other"})]})]}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group",children:[t.jsx("label",{className:"jsx-79e4f0e0f941e9c1 form-label",children:"Related Project (Optional)"}),(0,t.jsxs)("select",{value:er.projectId,onChange:e=>et({...er,projectId:Number(e.target.value)}),className:"jsx-79e4f0e0f941e9c1 form-select",children:[t.jsx("option",{value:0,className:"jsx-79e4f0e0f941e9c1",children:"Select a project (if applicable)"}),e.map(e=>t.jsx("option",{value:e.id,className:"jsx-79e4f0e0f941e9c1",children:e.name},e.id))]}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#666666",marginTop:"0.25rem"},className:"jsx-79e4f0e0f941e9c1",children:"Select the project this leave affects, if any"})]}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group",children:[t.jsx("label",{className:"jsx-79e4f0e0f941e9c1 form-label",children:"Reason for Leave"}),t.jsx("input",{type:"text",required:!0,placeholder:"Brief reason for your leave request...",value:er.reason,onChange:e=>et({...er,reason:e.target.value}),className:"jsx-79e4f0e0f941e9c1 form-input"})]}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group",children:[t.jsx("label",{className:"jsx-79e4f0e0f941e9c1 form-label",children:"Additional Notes (Optional)"}),t.jsx("textarea",{placeholder:"Any additional information or special instructions...",value:er.notes,onChange:e=>et({...er,notes:e.target.value}),className:"jsx-79e4f0e0f941e9c1 form-textarea"})]}),eA()>eo&&(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 error-message",children:["WARNING: You are requesting ",eA()," days but only have ",eo," days available."]}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-buttons",children:[t.jsx("button",{type:"button",onClick:eT,className:"jsx-79e4f0e0f941e9c1 btn btn-secondary",children:"Cancel"}),t.jsx("button",{type:"submit",disabled:eA()>eo||0===eA(),className:"jsx-79e4f0e0f941e9c1 btn btn-primary",children:"Submit Request"})]})]})]})]})}),ep&&t.jsx("div",{onClick:eE,className:"jsx-79e4f0e0f941e9c1 daily-report-overlay",children:(0,t.jsxs)("div",{onClick:e=>e.stopPropagation(),className:"jsx-79e4f0e0f941e9c1 daily-report-modal",children:[(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-report-header",children:[t.jsx("h1",{className:"jsx-79e4f0e0f941e9c1 daily-report-title",children:"Daily Report"}),t.jsx("button",{onClick:eE,title:"Close",className:"jsx-79e4f0e0f941e9c1 daily-close-btn",children:"\xd7"})]}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-report-body",children:[(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 date-info-banner",children:[t.jsx("h2",{className:"jsx-79e4f0e0f941e9c1 date-title",children:eu.dateDisplay}),t.jsx("p",{className:"jsx-79e4f0e0f941e9c1 date-subtitle",children:"Submit your daily progress report"})]}),(0,t.jsxs)("form",{onSubmit:eI,className:"jsx-79e4f0e0f941e9c1 daily-report-form",children:[t.jsx("div",{className:"jsx-79e4f0e0f941e9c1 form-row",children:(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group full-width",children:[t.jsx("label",{className:"jsx-79e4f0e0f941e9c1 daily-label",children:"Project / Team *"}),(0,t.jsxs)("select",{required:!0,value:eu.projectId,onChange:e=>eg({...eu,projectId:Number(e.target.value)}),className:"jsx-79e4f0e0f941e9c1 daily-select",children:[t.jsx("option",{value:0,className:"jsx-79e4f0e0f941e9c1",children:"Choose your project or team..."}),e.map(e=>t.jsx("option",{value:e.id,className:"jsx-79e4f0e0f941e9c1",children:e.name},e.id))]})]})}),t.jsx("div",{className:"jsx-79e4f0e0f941e9c1 form-row",children:(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group full-width",children:[t.jsx("label",{className:"jsx-79e4f0e0f941e9c1 daily-label",children:"KEY ACTIVITIES COMPLETED *"}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-container",children:[eu.keyActivities.map((e,a)=>(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-row",children:[t.jsx("input",{type:"text",required:0===a,placeholder:0===a?"Main task or deliverable completed...":"Additional activity...",value:e,onChange:e=>eq("keyActivities",a,e.target.value),className:"jsx-79e4f0e0f941e9c1 daily-input"}),eu.keyActivities.length>1&&t.jsx("button",{type:"button",onClick:()=>eM("keyActivities",a),title:"Remove this item",className:"jsx-79e4f0e0f941e9c1 daily-remove-btn",children:"\xd7"})]},a)),t.jsx("button",{type:"button",onClick:()=>eP("keyActivities"),className:"jsx-79e4f0e0f941e9c1 daily-add-btn",children:"Add another activity"})]})]})}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-row",children:[(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group half-width",children:[t.jsx("label",{className:"jsx-79e4f0e0f941e9c1 daily-label",children:"ONGOING TASKS"}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-container",children:[eu.ongoingTasks.map((e,a)=>(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-row",children:[t.jsx("input",{type:"text",placeholder:0===a?"Task in progress...":"Additional ongoing task...",value:e,onChange:e=>eq("ongoingTasks",a,e.target.value),className:"jsx-79e4f0e0f941e9c1 daily-input"}),eu.ongoingTasks.length>1&&t.jsx("button",{type:"button",onClick:()=>eM("ongoingTasks",a),title:"Remove this item",className:"jsx-79e4f0e0f941e9c1 daily-remove-btn",children:"\xd7"})]},a)),t.jsx("button",{type:"button",onClick:()=>eP("ongoingTasks"),className:"jsx-79e4f0e0f941e9c1 daily-add-btn",children:"Add ongoing task"})]})]}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group half-width",children:[t.jsx("label",{className:"jsx-79e4f0e0f941e9c1 daily-label",children:"CHALLENGES / ISSUES"}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-container",children:[eu.challenges.map((e,a)=>(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-row",children:[t.jsx("input",{type:"text",placeholder:0===a?"Any blocker or challenge...":"Additional challenge...",value:e,onChange:e=>eq("challenges",a,e.target.value),className:"jsx-79e4f0e0f941e9c1 daily-input"}),eu.challenges.length>1&&t.jsx("button",{type:"button",onClick:()=>eM("challenges",a),title:"Remove this item",className:"jsx-79e4f0e0f941e9c1 daily-remove-btn",children:"\xd7"})]},a)),t.jsx("button",{type:"button",onClick:()=>eP("challenges"),className:"jsx-79e4f0e0f941e9c1 daily-add-btn",children:"Add challenge"})]})]})]}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-row",children:[(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group half-width",children:[t.jsx("label",{className:"jsx-79e4f0e0f941e9c1 daily-label",children:"TEAM PERFORMANCE / KPIS"}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-container",children:[eu.teamPerformance.map((e,a)=>(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-row",children:[t.jsx("input",{type:"text",placeholder:0===a?"Performance metric or KPI...":"Additional KPI...",value:e,onChange:e=>eq("teamPerformance",a,e.target.value),className:"jsx-79e4f0e0f941e9c1 daily-input"}),eu.teamPerformance.length>1&&t.jsx("button",{type:"button",onClick:()=>eM("teamPerformance",a),title:"Remove this item",className:"jsx-79e4f0e0f941e9c1 daily-remove-btn",children:"\xd7"})]},a)),t.jsx("button",{type:"button",onClick:()=>eP("teamPerformance"),className:"jsx-79e4f0e0f941e9c1 daily-add-btn",children:"Add KPI"})]})]}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group half-width",children:[t.jsx("label",{className:"jsx-79e4f0e0f941e9c1 daily-label",children:"TOMORROW'S PRIORITIES"}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-container",children:[eu.nextDayPriorities.map((e,a)=>(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-field-row",children:[t.jsx("input",{type:"text",placeholder:0===a?"Key priority for tomorrow...":"Additional priority...",value:e,onChange:e=>eq("nextDayPriorities",a,e.target.value),className:"jsx-79e4f0e0f941e9c1 daily-input"}),eu.nextDayPriorities.length>1&&t.jsx("button",{type:"button",onClick:()=>eM("nextDayPriorities",a),title:"Remove this item",className:"jsx-79e4f0e0f941e9c1 daily-remove-btn",children:"\xd7"})]},a)),t.jsx("button",{type:"button",onClick:()=>eP("nextDayPriorities"),className:"jsx-79e4f0e0f941e9c1 daily-add-btn",children:"Add priority"})]})]})]}),t.jsx("div",{className:"jsx-79e4f0e0f941e9c1 form-row",children:(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group full-width",children:[t.jsx("label",{className:"jsx-79e4f0e0f941e9c1 daily-label",children:"MEETING MINUTES"}),t.jsx("textarea",{placeholder:"Meeting minutes, discussions, decisions made (if any)...",value:eu.meetingMinutes,onChange:e=>eg({...eu,meetingMinutes:e.target.value,hasMeetingMinutes:e.target.value.trim().length>0}),className:"jsx-79e4f0e0f941e9c1 daily-textarea"})]})}),t.jsx("div",{className:"jsx-79e4f0e0f941e9c1 form-row",children:(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 form-group full-width",children:[t.jsx("label",{className:"jsx-79e4f0e0f941e9c1 daily-label",children:"OTHER NOTES"}),t.jsx("textarea",{placeholder:"Additional observations, suggestions, or miscellaneous notes...",value:eu.otherNotes,onChange:e=>eg({...eu,otherNotes:e.target.value}),className:"jsx-79e4f0e0f941e9c1 daily-textarea"})]})}),(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 daily-form-buttons",children:[t.jsx("button",{type:"button",onClick:eE,className:"jsx-79e4f0e0f941e9c1 daily-btn-cancel",children:"Cancel"}),t.jsx("button",{type:"submit",className:"jsx-79e4f0e0f941e9c1 daily-btn-submit",children:"Submit Report"})]})]})]})]})}),eh&&t.jsx("div",{onClick:()=>ej(!1),className:"jsx-79e4f0e0f941e9c1 modal-overlay",children:(0,t.jsxs)("div",{onClick:e=>e.stopPropagation(),style:{maxWidth:"600px"},className:"jsx-79e4f0e0f941e9c1 modal-content",children:[(0,t.jsxs)("div",{className:"jsx-79e4f0e0f941e9c1 modal-header",children:[t.jsx("h2",{className:"jsx-79e4f0e0f941e9c1 modal-title",children:"Inbox"}),t.jsx("button",{onClick:()=>ej(!1),title:"Close",className:"jsx-79e4f0e0f941e9c1 modal-close-btn",children:t.jsx(T.Z,{style:{width:"24px",height:"24px"}})})]}),t.jsx("div",{style:{padding:"1rem",maxHeight:"70vh",overflowY:"auto"},className:"jsx-79e4f0e0f941e9c1 modal-body",children:eN?(0,t.jsxs)("div",{style:{textAlign:"center",padding:"2rem"},className:"jsx-79e4f0e0f941e9c1",children:[t.jsx("div",{style:{width:"32px",height:"32px",border:"3px solid #cccccc",borderTop:"3px solid #000000",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto"},className:"jsx-79e4f0e0f941e9c1"}),t.jsx("p",{style:{marginTop:"1rem",color:"#666666"},className:"jsx-79e4f0e0f941e9c1",children:"Loading notifications..."})]}):0===ey.length?(0,t.jsxs)("div",{style:{textAlign:"center",padding:"3rem"},className:"jsx-79e4f0e0f941e9c1",children:[t.jsx(F.Z,{style:{width:"48px",height:"48px",color:"#cccccc",margin:"0 auto 1rem"}}),t.jsx("h3",{style:{color:"#666666",marginBottom:"0.5rem"},className:"jsx-79e4f0e0f941e9c1",children:"No notifications"}),t.jsx("p",{style:{color:"#999999",fontSize:"0.9rem"},className:"jsx-79e4f0e0f941e9c1",children:"You're all caught up!"})]}):t.jsx("div",{className:"jsx-79e4f0e0f941e9c1",children:ey.map(e=>(0,t.jsxs)("div",{style:{display:"flex",gap:"1rem",padding:"1rem",borderBottom:"1px solid #e5e7eb",background:e.is_read?"#ffffff":"#f9f9f9",cursor:"pointer",transition:"all 0.2s ease"},onClick:()=>eR(e.id),className:"jsx-79e4f0e0f941e9c1",children:[t.jsx("div",{style:{flexShrink:0,marginTop:"0.25rem"},className:"jsx-79e4f0e0f941e9c1",children:eB(e.type)}),(0,t.jsxs)("div",{style:{flex:1,minWidth:0},className:"jsx-79e4f0e0f941e9c1",children:[(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.5rem"},className:"jsx-79e4f0e0f941e9c1",children:[t.jsx("h4",{style:{color:"#000000",fontSize:"0.9rem",fontWeight:e.is_read?"normal":"bold",margin:0},className:"jsx-79e4f0e0f941e9c1",children:e.title}),t.jsx("span",{style:{fontSize:"0.75rem",color:"#666666",flexShrink:0},className:"jsx-79e4f0e0f941e9c1",children:eZ(e.created_at)})]}),t.jsx("p",{style:{color:"#374151",fontSize:"0.85rem",lineHeight:"1.4",margin:0},className:"jsx-79e4f0e0f941e9c1",children:e.message}),!e.is_read&&t.jsx("div",{style:{width:"6px",height:"6px",background:"#ef4444",borderRadius:"50%",position:"absolute",right:"1rem",top:"50%",transform:"translateY(-50%)"},className:"jsx-79e4f0e0f941e9c1"})]})]},e.id))})})]})}),t.jsx(s(),{id:"79e4f0e0f941e9c1",children:".daily-report-overlay.jsx-79e4f0e0f941e9c1{position:fixed;inset:0;background:rgba(0,0,0,.5);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;padding:2rem;z-index:1000;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}.daily-report-modal.jsx-79e4f0e0f941e9c1{background:#fff;border:1px solid#e5e7eb;-webkit-border-radius:16px;-moz-border-radius:16px;border-radius:16px;width:100%;max-width:1200px;max-height:95vh;overflow:hidden;-webkit-box-shadow:0 4px 12px rgba(0,0,0,.15);-moz-box-shadow:0 4px 12px rgba(0,0,0,.15);box-shadow:0 4px 12px rgba(0,0,0,.15);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column}.daily-report-header.jsx-79e4f0e0f941e9c1{background:#fff;color:#111827;padding:2rem;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;border-bottom:1px solid#e5e7eb}.daily-report-title.jsx-79e4f0e0f941e9c1{font-size:1.75rem;font-weight:700;margin:0;letter-spacing:-.025em}.daily-close-btn.jsx-79e4f0e0f941e9c1{background:#fff;color:#6b7280;border:1px solid#d1d5db;width:40px;height:40px;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;cursor:pointer;font-size:20px;font-weight:500;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease}.daily-close-btn.jsx-79e4f0e0f941e9c1:hover{background:#f9fafb;color:#374151}.daily-report-body.jsx-79e4f0e0f941e9c1{padding:2rem 3rem 3rem 3rem;-webkit-box-flex:1;-webkit-flex:1;-moz-box-flex:1;-ms-flex:1;flex:1;overflow-y:auto;overflow-x:hidden;background:#fff;scroll-behavior:smooth}.date-info-banner.jsx-79e4f0e0f941e9c1{background:#f9fafb;border:1px solid#e5e7eb;padding:2rem;text-align:center;margin-bottom:3rem;-webkit-border-radius:12px;-moz-border-radius:12px;border-radius:12px}.date-title.jsx-79e4f0e0f941e9c1{font-size:1.25rem;font-weight:600;color:#111827;margin:0 0 .5rem 0;letter-spacing:-.025em}.date-subtitle.jsx-79e4f0e0f941e9c1{font-size:.875rem;color:#6b7280;margin:0}.daily-report-form.jsx-79e4f0e0f941e9c1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column;gap:2rem;padding-bottom:2rem}.form-row.jsx-79e4f0e0f941e9c1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;gap:2rem;width:100%}.form-group.jsx-79e4f0e0f941e9c1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column;gap:.75rem}.form-group.full-width.jsx-79e4f0e0f941e9c1{-webkit-box-flex:1;-webkit-flex:1;-moz-box-flex:1;-ms-flex:1;flex:1}.form-group.half-width.jsx-79e4f0e0f941e9c1{-webkit-box-flex:1;-webkit-flex:1;-moz-box-flex:1;-ms-flex:1;flex:1}.daily-label.jsx-79e4f0e0f941e9c1{font-size:.875rem;font-weight:600;color:#374151;margin:0;padding-bottom:.25rem}.daily-select.jsx-79e4f0e0f941e9c1{width:100%;padding:.875rem 1rem;border:1px solid#d1d5db;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;font-size:.875rem;background:#fff;color:#111827;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.daily-select.jsx-79e4f0e0f941e9c1:focus{outline:none;border-color:#374151;-webkit-box-shadow:0 0 0 3px rgba(55,65,81,.1);-moz-box-shadow:0 0 0 3px rgba(55,65,81,.1);box-shadow:0 0 0 3px rgba(55,65,81,.1)}.daily-field-container.jsx-79e4f0e0f941e9c1{background:#fff;border:1px solid#e5e7eb;padding:1.5rem;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column;gap:1rem}.daily-field-row.jsx-79e4f0e0f941e9c1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;gap:.75rem}.daily-input.jsx-79e4f0e0f941e9c1{-webkit-box-flex:1;-webkit-flex:1;-moz-box-flex:1;-ms-flex:1;flex:1;padding:.75rem 1rem;border:1px solid#d1d5db;-webkit-border-radius:6px;-moz-border-radius:6px;border-radius:6px;font-size:.875rem;background:#fff;color:#111827;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.daily-input.jsx-79e4f0e0f941e9c1:focus{outline:none;border-color:#374151;-webkit-box-shadow:0 0 0 3px rgba(55,65,81,.1);-moz-box-shadow:0 0 0 3px rgba(55,65,81,.1);box-shadow:0 0 0 3px rgba(55,65,81,.1)}.daily-input.jsx-79e4f0e0f941e9c1:hover{border-color:#9ca3af}.daily-input.jsx-79e4f0e0f941e9c1::-webkit-input-placeholder{color:#9ca3af}.daily-input.jsx-79e4f0e0f941e9c1:-moz-placeholder{color:#9ca3af}.daily-input.jsx-79e4f0e0f941e9c1::-moz-placeholder{color:#9ca3af}.daily-input.jsx-79e4f0e0f941e9c1:-ms-input-placeholder{color:#9ca3af}.daily-input.jsx-79e4f0e0f941e9c1::-ms-input-placeholder{color:#9ca3af}.daily-input.jsx-79e4f0e0f941e9c1::placeholder{color:#9ca3af}.daily-remove-btn.jsx-79e4f0e0f941e9c1{background:#fff;color:#6b7280;border:1px solid#d1d5db;width:32px;height:32px;-webkit-border-radius:6px;-moz-border-radius:6px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.daily-remove-btn.jsx-79e4f0e0f941e9c1:hover{background:#f3f4f6;color:#374151}.daily-add-btn.jsx-79e4f0e0f941e9c1{background:#f9fafb;color:#374151;border:1px solid#d1d5db;-webkit-border-radius:6px;-moz-border-radius:6px;border-radius:6px;padding:.75rem 1.25rem;font-size:.875rem;font-weight:500;cursor:pointer;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;-webkit-align-self:flex-start;-ms-flex-item-align:start;align-self:flex-start}.daily-add-btn.jsx-79e4f0e0f941e9c1:hover{background:#f3f4f6;border-color:#9ca3af}.daily-textarea.jsx-79e4f0e0f941e9c1{width:100%;min-height:120px;padding:.875rem 1rem;border:1px solid#d1d5db;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;font-size:.875rem;background:#fff;color:#111827;resize:vertical;font-family:inherit;line-height:1.5;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.daily-textarea.jsx-79e4f0e0f941e9c1:focus{outline:none;border-color:#374151;-webkit-box-shadow:0 0 0 3px rgba(55,65,81,.1);-moz-box-shadow:0 0 0 3px rgba(55,65,81,.1);box-shadow:0 0 0 3px rgba(55,65,81,.1)}.daily-textarea.jsx-79e4f0e0f941e9c1:hover{border-color:#9ca3af}.daily-textarea.jsx-79e4f0e0f941e9c1::-webkit-input-placeholder{color:#9ca3af}.daily-textarea.jsx-79e4f0e0f941e9c1:-moz-placeholder{color:#9ca3af}.daily-textarea.jsx-79e4f0e0f941e9c1::-moz-placeholder{color:#9ca3af}.daily-textarea.jsx-79e4f0e0f941e9c1:-ms-input-placeholder{color:#9ca3af}.daily-textarea.jsx-79e4f0e0f941e9c1::-ms-input-placeholder{color:#9ca3af}.daily-textarea.jsx-79e4f0e0f941e9c1::placeholder{color:#9ca3af}.daily-form-buttons.jsx-79e4f0e0f941e9c1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;gap:1rem;-webkit-box-pack:end;-webkit-justify-content:flex-end;-moz-box-pack:end;-ms-flex-pack:end;justify-content:flex-end;padding:2rem 0 1rem 0;margin-top:2rem;border-top:1px solid#e5e7eb}.daily-btn-cancel.jsx-79e4f0e0f941e9c1{background:#fff;color:#374151;border:1px solid#d1d5db;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;padding:.875rem 1.5rem;font-size:.875rem;font-weight:500;cursor:pointer;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease}.daily-btn-cancel.jsx-79e4f0e0f941e9c1:hover{background:#f3f4f6;border-color:#9ca3af}.daily-btn-submit.jsx-79e4f0e0f941e9c1{background:#111827;color:#fff;border:1px solid#111827;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;padding:.875rem 1.5rem;font-size:.875rem;font-weight:500;cursor:pointer;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease}.daily-btn-submit.jsx-79e4f0e0f941e9c1:hover{background:#1f2937;border-color:#1f2937}@media(max-width:768px){.weekly-report-overlay.jsx-79e4f0e0f941e9c1{padding:1rem}.daily-report-modal.jsx-79e4f0e0f941e9c1{max-width:100%;max-height:98vh}.daily-report-header.jsx-79e4f0e0f941e9c1{padding:1.5rem}.daily-report-title.jsx-79e4f0e0f941e9c1{font-size:1.5rem}.daily-report-body.jsx-79e4f0e0f941e9c1{padding:1.5rem}.form-row.jsx-79e4f0e0f941e9c1{-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column;gap:1.5rem}.daily-form-buttons.jsx-79e4f0e0f941e9c1{-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column;gap:1rem}.daily-btn-cancel.jsx-79e4f0e0f941e9c1,.daily-btn-submit.jsx-79e4f0e0f941e9c1{width:100%;text-align:center}}.modal-overlay.jsx-79e4f0e0f941e9c1{position:fixed;inset:0;background:rgba(0,0,0,.5);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;padding:1.5rem;z-index:1000;-webkit-animation:fadeIn.3s ease;-moz-animation:fadeIn.3s ease;-o-animation:fadeIn.3s ease;animation:fadeIn.3s ease}.modal-content.jsx-79e4f0e0f941e9c1{background:#fff;border:1px solid#e5e7eb;-webkit-border-radius:16px;-moz-border-radius:16px;border-radius:16px;padding:0;width:100%;max-width:520px;max-height:90vh;overflow:hidden;-webkit-box-shadow:0 10px 25px rgba(0,0,0,.15);-moz-box-shadow:0 10px 25px rgba(0,0,0,.15);box-shadow:0 10px 25px rgba(0,0,0,.15);-webkit-animation:slideIn.3s ease;-moz-animation:slideIn.3s ease;-o-animation:slideIn.3s ease;animation:slideIn.3s ease;position:relative}.modal-header.jsx-79e4f0e0f941e9c1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;padding:2rem 2rem 1rem 2rem;border-bottom:1px solid#e5e7eb;background:#fff;position:relative}.modal-title.jsx-79e4f0e0f941e9c1{font-size:1.5rem;font-weight:700;color:#111827;margin:0;letter-spacing:-.025em}.modal-close-btn.jsx-79e4f0e0f941e9c1{background:#fff;border:1px solid#d1d5db;padding:.75rem;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;cursor:pointer;color:#6b7280;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center}.modal-close-btn.jsx-79e4f0e0f941e9c1:hover{background:#f9fafb;border-color:#9ca3af;color:#374151}.modal-body.jsx-79e4f0e0f941e9c1{padding:2rem;max-height:75vh;overflow-y:auto}.leave-stats.jsx-79e4f0e0f941e9c1{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-bottom:2rem}.stat-card.jsx-79e4f0e0f941e9c1{text-align:center;padding:1.5rem 1rem;background:#f9fafb;-webkit-border-radius:12px;-moz-border-radius:12px;border-radius:12px;border:1px solid#e5e7eb;position:relative;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;-webkit-box-shadow:0 1px 3px rgba(0,0,0,.1);-moz-box-shadow:0 1px 3px rgba(0,0,0,.1);box-shadow:0 1px 3px rgba(0,0,0,.1);overflow:hidden}.stat-card.jsx-79e4f0e0f941e9c1:hover{-webkit-transform:translatey(-2px);-moz-transform:translatey(-2px);-ms-transform:translatey(-2px);-o-transform:translatey(-2px);transform:translatey(-2px);-webkit-box-shadow:0 4px 12px rgba(0,0,0,.15);-moz-box-shadow:0 4px 12px rgba(0,0,0,.15);box-shadow:0 4px 12px rgba(0,0,0,.15)}.stat-number.jsx-79e4f0e0f941e9c1{font-size:2rem;font-weight:700;margin-bottom:.5rem;color:#111827;letter-spacing:-.025em}.stat-label.jsx-79e4f0e0f941e9c1{font-size:.75rem;color:#6b7280;font-weight:500}.form-grid.jsx-79e4f0e0f941e9c1{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem}.form-group.jsx-79e4f0e0f941e9c1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column;gap:.5rem}.form-label.jsx-79e4f0e0f941e9c1{font-size:.875rem;font-weight:600;color:#374151;margin-bottom:.5rem}.form-input.jsx-79e4f0e0f941e9c1{width:100%;padding:.875rem 1rem;border:1px solid#d1d5db;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;font-size:.875rem;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;background:#fff;color:#111827;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.form-input.jsx-79e4f0e0f941e9c1:focus{outline:none;border-color:#374151;-webkit-box-shadow:0 0 0 3px rgba(55,65,81,.1);-moz-box-shadow:0 0 0 3px rgba(55,65,81,.1);box-shadow:0 0 0 3px rgba(55,65,81,.1)}.form-input.jsx-79e4f0e0f941e9c1:hover{border-color:#9ca3af}.form-input.jsx-79e4f0e0f941e9c1::-webkit-input-placeholder{color:#9ca3af}.form-input.jsx-79e4f0e0f941e9c1:-moz-placeholder{color:#9ca3af}.form-input.jsx-79e4f0e0f941e9c1::-moz-placeholder{color:#9ca3af}.form-input.jsx-79e4f0e0f941e9c1:-ms-input-placeholder{color:#9ca3af}.form-input.jsx-79e4f0e0f941e9c1::-ms-input-placeholder{color:#9ca3af}.form-input.jsx-79e4f0e0f941e9c1::placeholder{color:#9ca3af}.form-select.jsx-79e4f0e0f941e9c1{width:100%;padding:.875rem 1rem;border:1px solid#d1d5db;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;font-size:.875rem;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;background:#fff;color:#111827;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;cursor:pointer}.form-select.jsx-79e4f0e0f941e9c1:focus{outline:none;border-color:#374151;-webkit-box-shadow:0 0 0 3px rgba(55,65,81,.1);-moz-box-shadow:0 0 0 3px rgba(55,65,81,.1);box-shadow:0 0 0 3px rgba(55,65,81,.1)}.form-select.jsx-79e4f0e0f941e9c1:hover{border-color:#9ca3af}.form-textarea.jsx-79e4f0e0f941e9c1{width:100%;min-height:100px;padding:.875rem 1rem;border:1px solid#d1d5db;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;font-size:.875rem;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;background:#fff;color:#111827;resize:vertical;font-family:inherit;line-height:1.5;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.form-textarea.jsx-79e4f0e0f941e9c1:focus{outline:none;border-color:#374151;-webkit-box-shadow:0 0 0 3px rgba(55,65,81,.1);-moz-box-shadow:0 0 0 3px rgba(55,65,81,.1);box-shadow:0 0 0 3px rgba(55,65,81,.1)}.form-textarea.jsx-79e4f0e0f941e9c1:hover{border-color:#9ca3af}.form-textarea.jsx-79e4f0e0f941e9c1::-webkit-input-placeholder{color:#9ca3af}.form-textarea.jsx-79e4f0e0f941e9c1:-moz-placeholder{color:#9ca3af}.form-textarea.jsx-79e4f0e0f941e9c1::-moz-placeholder{color:#9ca3af}.form-textarea.jsx-79e4f0e0f941e9c1:-ms-input-placeholder{color:#9ca3af}.form-textarea.jsx-79e4f0e0f941e9c1::-ms-input-placeholder{color:#9ca3af}.form-textarea.jsx-79e4f0e0f941e9c1::placeholder{color:#9ca3af}.error-message.jsx-79e4f0e0f941e9c1{background:#fef2f2;border:1px solid#fecaca;color:#dc2626;padding:1rem;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;margin-bottom:1.5rem;font-size:.875rem;font-weight:500}.form-buttons.jsx-79e4f0e0f941e9c1{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;gap:1rem;-webkit-box-pack:end;-webkit-justify-content:flex-end;-moz-box-pack:end;-ms-flex-pack:end;justify-content:flex-end;margin-top:2rem;padding-top:1.5rem;border-top:1px solid#e5e7eb}.btn.jsx-79e4f0e0f941e9c1{padding:.875rem 1.5rem;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px;font-size:.875rem;font-weight:500;cursor:pointer;-webkit-transition:all.2s ease;-moz-transition:all.2s ease;-o-transition:all.2s ease;transition:all.2s ease;border:1px solid}.btn-secondary.jsx-79e4f0e0f941e9c1{background:#fff;color:#374151;border-color:#d1d5db}.btn-secondary.jsx-79e4f0e0f941e9c1:hover{background:#f3f4f6;border-color:#9ca3af}.btn-primary.jsx-79e4f0e0f941e9c1{background:#111827;color:#fff;border-color:#111827}.btn-primary.jsx-79e4f0e0f941e9c1:hover:not(:disabled){background:#1f2937;border-color:#1f2937}.btn.jsx-79e4f0e0f941e9c1:disabled{opacity:.5;cursor:not-allowed}@-webkit-keyframes fadeIn{from{opacity:0}to{opacity:1}}@-moz-keyframes fadeIn{from{opacity:0}to{opacity:1}}@-o-keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@-webkit-keyframes slideIn{from{-webkit-transform:translatey(-20px)scale(.95);transform:translatey(-20px)scale(.95);opacity:0}to{-webkit-transform:translatey(0)scale(1);transform:translatey(0)scale(1);opacity:1}}@-moz-keyframes slideIn{from{-moz-transform:translatey(-20px)scale(.95);transform:translatey(-20px)scale(.95);opacity:0}to{-moz-transform:translatey(0)scale(1);transform:translatey(0)scale(1);opacity:1}}@-o-keyframes slideIn{from{-o-transform:translatey(-20px)scale(.95);transform:translatey(-20px)scale(.95);opacity:0}to{-o-transform:translatey(0)scale(1);transform:translatey(0)scale(1);opacity:1}}@keyframes slideIn{from{-webkit-transform:translatey(-20px)scale(.95);-moz-transform:translatey(-20px)scale(.95);-o-transform:translatey(-20px)scale(.95);transform:translatey(-20px)scale(.95);opacity:0}to{-webkit-transform:translatey(0)scale(1);-moz-transform:translatey(0)scale(1);-o-transform:translatey(0)scale(1);transform:translatey(0)scale(1);opacity:1}}@media(max-width:768px){.modal-content.jsx-79e4f0e0f941e9c1{max-width:95vw;margin:1rem}.modal-header.jsx-79e4f0e0f941e9c1{padding:1.5rem 1.5rem 1rem 1.5rem}.modal-title.jsx-79e4f0e0f941e9c1{font-size:1.25rem}.modal-body.jsx-79e4f0e0f941e9c1{padding:1.5rem}.leave-stats.jsx-79e4f0e0f941e9c1{grid-template-columns:1fr;gap:1rem}.form-grid.jsx-79e4f0e0f941e9c1{grid-template-columns:1fr;gap:1rem}.form-buttons.jsx-79e4f0e0f941e9c1{-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column}.btn.jsx-79e4f0e0f941e9c1{width:100%;text-align:center}}@media(max-width:480px){.modal-overlay.jsx-79e4f0e0f941e9c1{padding:1rem}.modal-content.jsx-79e4f0e0f941e9c1{-webkit-border-radius:12px;-moz-border-radius:12px;border-radius:12px;max-height:95vh}}"})]})}},3881:(e,a,r)=>{r.r(a),r.d(a,{default:()=>o});var t=r(8531);let o=e=>{let a=(0,t.fillMetadataSegment)(".",e.params,"favicon.ico");return[{type:"image/x-icon",sizes:"16x16",url:a+""}]}}};