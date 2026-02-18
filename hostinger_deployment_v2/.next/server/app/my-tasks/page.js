(()=>{var e={};e.id=3237,e.ids=[3237],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},13685:e=>{"use strict";e.exports=require("http")},95687:e=>{"use strict";e.exports=require("https")},71017:e=>{"use strict";e.exports=require("path")},85477:e=>{"use strict";e.exports=require("punycode")},12781:e=>{"use strict";e.exports=require("stream")},57310:e=>{"use strict";e.exports=require("url")},59796:e=>{"use strict";e.exports=require("zlib")},5392:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>n.a,__next_app__:()=>p,originalPathname:()=>m,pages:()=>c,routeModule:()=>g,tree:()=>d});var a=r(67096),i=r(16132),s=r(37284),n=r.n(s),o=r(32564),l={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>o[e]);r.d(t,l);let d=["",{children:["my-tasks",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,61702)),"/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/my-tasks/page.tsx"]}]},{metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(r.bind(r,28835)),"/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,9291,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],c=["/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/my-tasks/page.tsx"],m="/my-tasks/page",p={require:r,loadChunk:()=>Promise.resolve()},g=new a.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/my-tasks/page",pathname:"/my-tasks",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},16383:(e,t,r)=>{Promise.resolve().then(r.bind(r,92101))},75548:(e,t,r)=>{"use strict";e.exports=r(67490)},51018:(e,t,r)=>{"use strict";e.exports=r(27804)},92101:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>_});var a=r(53854),i=r(34218),s=r(51018),n=r(56837),o=r(44937),l=r(61685),d=r(84063),c=r(20199),m=r(54791),p=r(2432),g=r(90856),u=r(69072),h=r(49402),f=r(10789),x=r(67689),b=r(66823);r(73638);let v=i.forwardRef(function({title:e,titleId:t,...r},a){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:a,"aria-labelledby":t},r),e?i.createElement("title",{id:t},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"}))});var w=r(42150),y=r(70856),k=r(71888),j=r(96835);r(74448),r(47485),r(19866),r(44358),r(88930),r(97690);let N=[{value:"low",label:"Low",icon:"",color:"#10b981"},{value:"medium",label:"Medium",icon:"",color:"#f59e0b"},{value:"high",label:"High",icon:"",color:"#ef4444"},{value:"urgent",label:"Urgent",icon:"",color:"#dc2626"}],F=[{value:"todo",label:"To Do",icon:"",color:"#e5e7eb"},{value:"in_progress",label:"In Progress",icon:"",color:"#dbeafe"},{value:"review",label:"Review",icon:"",color:"#fef3c7"},{value:"done",label:"Done",icon:"",color:"#d1fae5"}];function C({task:e,users:t,onClose:r,onSave:s,onStatusChange:n,onDelete:o}){var l,p,g;let[f,x]=(0,i.useState)(!1),[b,C]=(0,i.useState)(!1),[D,S]=(0,i.useState)("task"),E=(0,i.useCallback)(e=>{if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;if(e.includes("T"))return e.split("T")[0];let t=new Date(e);return isNaN(t.getTime())?"":t.toISOString().split("T")[0]},[]),[A,_]=(0,i.useState)({name:e.name,description:e.description,priority:e.priority,due_date:E(e.due_date),start_date:E(e.start_date),assignee_ids:e.assignees?e.assignees.map(e=>e.id):e.assignee?[e.assignee.id]:[],tags:e.tags_list.join(", ")});(0,i.useEffect)(()=>{_({name:e.name,description:e.description,priority:e.priority,due_date:E(e.due_date),start_date:E(e.start_date),assignee_ids:e.assignees?e.assignees.map(e=>e.id):e.assignee?[e.assignee.id]:[],tags:e.tags_list.join(", ")})},[e,E]);let L=e=>e?new Date(e).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):"Not set",z=e=>new Date(e).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),Z=async()=>{try{let e=e=>{if(!e)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;if(e.includes("T"))return e.split("T")[0];let t=new Date(e);return isNaN(t.getTime())?null:t.toISOString().split("T")[0]},t={...A,tags:A.tags,assignee_ids:A.assignee_ids&&A.assignee_ids.length>0?A.assignee_ids:[],due_date:e(A.due_date),start_date:e(A.start_date)};console.log("Saving task with assignee_ids:",t.assignee_ids),console.log("Saving task with formatted dates:",{due_date:t.due_date,start_date:t.start_date}),await s(t),x(!1)}catch(e){console.error("Failed to save task:",e)}},M=async t=>{n&&await n(e.id,t)},T=(l=e.priority,N.find(e=>e.value===l)||N[1]),R=(p=e.status,F.find(e=>e.value===p)||F[0]),B=!!(g=e.due_date)&&new Date(g)<new Date,W=[{id:"task",label:"Task",icon:a.jsx(c.Z,{style:{width:"16px",height:"16px"}})},{id:"comments",label:"Comments & Files",icon:a.jsx(v,{style:{width:"16px",height:"16px"}})}];return f?a.jsx("input",{type:"text",value:A.name,onChange:e=>_({...A,name:e.target.value}),className:"form-input",style:{fontSize:"1.5rem",fontWeight:"bold",marginBottom:"1rem"}}):a.jsx("h2",{className:"task-title",children:e.name}),T.icon,T.label,R.icon,R.label,B&&w.Z,y.Z,o&&(()=>C(!0),k.Z),j.Z,W.map(e=>(0,a.jsxs)("button",{onClick:()=>S(e.id),className:`tab-button ${D===e.id?"active":""}`,children:[e.icon,a.jsx("span",{children:e.label})]},e.id)),"task"===D&&(a.Fragment,f?(0,a.jsxs)("div",{className:"edit-form",children:[(0,a.jsxs)("div",{className:"form-group",children:[a.jsx("label",{className:"form-label",children:"Description"}),a.jsx("textarea",{value:A.description,onChange:e=>_({...A,description:e.target.value}),className:"form-textarea",placeholder:"Describe what needs to be done..."})]}),(0,a.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(min(200px, 100%), 1fr))",gap:"1rem"},children:[(0,a.jsxs)("div",{className:"form-group",children:[a.jsx("label",{className:"form-label",children:"Priority"}),a.jsx("select",{value:A.priority,onChange:e=>_({...A,priority:e.target.value}),className:"form-select",children:N.map(e=>(0,a.jsxs)("option",{value:e.value,children:[e.icon," ",e.label]},e.value))})]}),(0,a.jsxs)("div",{className:"form-group",children:[a.jsx("label",{className:"form-label",children:"Assignees"}),a.jsx("div",{style:{border:"2px solid #2D2D2D",borderRadius:"8px",padding:"0.75rem",background:"#141414",minHeight:"100px",maxHeight:"150px",overflowY:"auto"},children:0===t.length?a.jsx("div",{style:{color:"#71717A",fontStyle:"italic",textAlign:"center",padding:"1rem"},children:"No team members available"}):t.map(e=>(0,a.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.4rem",cursor:"pointer",borderRadius:"4px",transition:"background-color 0.2s ease",marginBottom:"0.2rem"},onMouseOver:e=>e.currentTarget.style.backgroundColor="#1F1F1F",onMouseOut:e=>e.currentTarget.style.backgroundColor="transparent",children:[a.jsx("input",{type:"checkbox",checked:A.assignee_ids.includes(e.id),onChange:t=>{t.target.checked?_({...A,assignee_ids:[...A.assignee_ids,e.id]}):_({...A,assignee_ids:A.assignee_ids.filter(t=>t!==e.id)})},style:{marginRight:"0.5rem",accentColor:"#FFFFFF"}}),a.jsx("div",{style:{width:"28px",height:"28px",borderRadius:"50%",background:A.assignee_ids.includes(e.id)?"#FFFFFF":"#1F1F1F",color:A.assignee_ids.includes(e.id)?"#000000":"#FFFFFF",border:"2px solid #FFFFFF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.8rem",fontWeight:"600"},children:e.name.charAt(0).toUpperCase()}),a.jsx("span",{style:{fontSize:"0.85rem",fontWeight:"500",color:(A.assignee_ids.includes(e.id),"#FFFFFF")},children:e.name})]},e.id))}),A.assignee_ids.length>0&&a.jsx("div",{style:{marginTop:"0.5rem",padding:"0.4rem",background:"#1A1A1A",border:"1px solid #3b82f6",borderRadius:"4px",fontSize:"0.8rem",color:"#FFFFFF"},children:(0,a.jsxs)("strong",{children:[A.assignee_ids.length," assignee",1===A.assignee_ids.length?"":"s"," selected"]})})]}),(0,a.jsxs)("div",{className:"form-group",children:[a.jsx("label",{className:"form-label",children:"Created by"}),a.jsx("input",{type:"text",value:e.created_by?.name||"Unknown User",className:"form-input",disabled:!0,style:{backgroundColor:"#141414",color:"#71717A",cursor:"not-allowed"}})]})]}),(0,a.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(min(250px, 100%), 1fr))",gap:"1rem"},children:[(0,a.jsxs)("div",{className:"form-group",children:[a.jsx("label",{className:"form-label",children:"Start Date"}),a.jsx("input",{type:"date",value:A.start_date,onChange:e=>_({...A,start_date:e.target.value}),className:"form-input"})]}),(0,a.jsxs)("div",{className:"form-group",children:[a.jsx("label",{className:"form-label",children:"Due Date"}),a.jsx("input",{type:"date",value:A.due_date,onChange:e=>_({...A,due_date:e.target.value}),className:"form-input"})]})]}),(0,a.jsxs)("div",{className:"form-group",children:[a.jsx("label",{className:"form-label",children:"Tags"}),a.jsx("input",{type:"text",value:A.tags,onChange:e=>_({...A,tags:e.target.value}),className:"form-input",placeholder:"frontend, urgent, bug (comma-separated)"})]}),(0,a.jsxs)("div",{className:"form-actions",children:[a.jsx("button",{onClick:()=>x(!1),className:"btn btn-secondary",children:"Cancel"}),a.jsx("button",{onClick:Z,className:"btn btn-primary",children:"Save Changes"})]})]}):(0,a.jsxs)(a.Fragment,{children:[a.jsx("div",{className:`task-description ${e.description?"":"empty"}`,children:e.description||"No description provided."}),(0,a.jsxs)("div",{className:"task-details-grid",children:[(0,a.jsxs)("div",{className:"task-detail-item",children:[a.jsx(u.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,a.jsxs)("div",{className:"task-detail-content",children:[a.jsx("div",{className:"task-detail-label",children:e.assignees&&e.assignees.length>1?"Assignees":"Assignee"}),a.jsx("div",{className:"task-detail-value",children:e.assignees&&e.assignees.length>0?a.jsx("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap"},children:e.assignees.map((t,r)=>(0,a.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"0.25rem"},children:[a.jsx("div",{style:{width:"24px",height:"24px",borderRadius:"50%",background:"#FFFFFF",color:"#000000",border:"2px solid #2D2D2D",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",fontWeight:"600",marginLeft:r>0?"-8px":"0",zIndex:e.assignees.length-r,position:"relative"},children:t.name.charAt(0).toUpperCase()}),a.jsx("span",{style:{fontSize:"0.875rem",fontWeight:"500",color:"#FFFFFF"},children:t.name}),r<e.assignees.length-1&&e.assignees.length>1&&a.jsx("span",{style:{color:"#71717A"},children:","})]},t.id))}):e.assignee?e.assignee.name:"Unassigned"})]})]}),(0,a.jsxs)("div",{className:"task-detail-item",children:[a.jsx(d.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,a.jsxs)("div",{className:"task-detail-content",children:[a.jsx("div",{className:"task-detail-label",children:"Due Date"}),a.jsx("div",{className:"task-detail-value",children:L(e.due_date)})]})]}),(0,a.jsxs)("div",{className:"task-detail-item",children:[a.jsx(m.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,a.jsxs)("div",{className:"task-detail-content",children:[a.jsx("div",{className:"task-detail-label",children:"Start Date"}),a.jsx("div",{className:"task-detail-value",children:L(e.start_date)})]})]}),(0,a.jsxs)("div",{className:"task-detail-item",children:[a.jsx(m.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,a.jsxs)("div",{className:"task-detail-content",children:[a.jsx("div",{className:"task-detail-label",children:"Estimated Hours"}),a.jsx("div",{className:"task-detail-value",children:e.estimated_hours?`${e.estimated_hours}h`:"Not set"})]})]}),e.tags_list&&e.tags_list.length>0&&(0,a.jsxs)("div",{className:"task-detail-item",children:[a.jsx(h.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,a.jsxs)("div",{className:"task-detail-content",children:[a.jsx("div",{className:"task-detail-label",children:"Tags"}),a.jsx("div",{className:"task-detail-value",children:e.tags_list.join(", ")})]})]}),(0,a.jsxs)("div",{className:"task-detail-item",children:[a.jsx(u.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,a.jsxs)("div",{className:"task-detail-content",children:[a.jsx("div",{className:"task-detail-label",children:"Created by"}),a.jsx("div",{className:"task-detail-value",children:e.created_by?.name||"Unknown User"})]})]}),(0,a.jsxs)("div",{className:"task-detail-item",children:[a.jsx(d.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,a.jsxs)("div",{className:"task-detail-content",children:[a.jsx("div",{className:"task-detail-label",children:"Created"}),a.jsx("div",{className:"task-detail-value",children:z(e.created_at)})]})]}),(0,a.jsxs)("div",{className:"task-detail-item",children:[a.jsx(d.Z,{className:"task-detail-icon",style:{width:"20px",height:"20px"}}),(0,a.jsxs)("div",{className:"task-detail-content",children:[a.jsx("div",{className:"task-detail-label",children:"Last Updated"}),a.jsx("div",{className:"task-detail-value",children:z(e.updated_at)})]})]})]}),!f&&n&&(0,a.jsxs)("div",{className:"task-status-actions-inline",children:[a.jsx("div",{className:"status-actions-title",children:"Change Status"}),a.jsx("div",{className:"status-buttons",children:F.map(t=>(0,a.jsxs)("button",{onClick:()=>M(t.value),className:`status-btn ${t.value===e.status?"current":""}`,disabled:t.value===e.status,children:[a.jsx("span",{children:t.icon}),a.jsx("span",{children:t.label})]},t.value))})]})]})),b&&(()=>C(!1),e.name),null}var D=r(28528);let S=[{value:"todo",label:"To Do",color:"#f3f4f6",icon:""},{value:"in_progress",label:"In Progress",color:"#dbeafe",icon:""},{value:"review",label:"Review",color:"#fef3c7",icon:""},{value:"done",label:"Done",color:"#d1fae5",icon:""}],E=[{value:"low",label:"Low",color:"#10b981",icon:""},{value:"medium",label:"Medium",color:"#f59e0b",icon:""},{value:"high",label:"High",color:"#ef4444",icon:""},{value:"urgent",label:"Urgent",color:"#dc2626",icon:""}],A=[{value:"all",label:"All Tasks"},{value:"todo",label:"To Do"},{value:"in_progress",label:"In Progress"},{value:"in_review",label:"In Review"},{value:"done",label:"Done"},{value:"overdue",label:"Overdue"},{value:"today",label:"Due Today"},{value:"this_week",label:"Due This Week"}];function _(){let e=(0,s.useRouter)(),{user:t,isAuthenticated:r,isLoading:v}=(0,n.useAuth)(),[w,y]=(0,i.useState)([]),[k,j]=(0,i.useState)([]),[N,F]=(0,i.useState)([]),[_,L]=(0,i.useState)([]),[z,Z]=(0,i.useState)(!0),[M,T]=(0,i.useState)(""),[R,B]=(0,i.useState)(""),[W,I]=(0,i.useState)("all"),[O,H]=(0,i.useState)("all"),[Y,$]=(0,i.useState)(null),[P,U]=(0,i.useState)(!1),[V,q]=(0,i.useState)([]),[G,J]=(0,i.useState)([]),[K,X]=(0,i.useState)(""),[Q,ee]=(0,i.useState)(!1),[et,er]=(0,i.useState)(!1),[ea,ei]=(0,i.useState)(null),[es,en]=(0,i.useState)(!1),[eo,el]=(0,i.useState)("details"),[ed,ec]=(0,i.useState)(!1),[em,ep]=(0,i.useState)(!1);(0,i.useEffect)(()=>{let e=()=>{ec(window.innerWidth<768)};e(),window.addEventListener("resize",e);let t=e=>{ep(e.detail.isCollapsed)};window.addEventListener("sidebarCollapsedChange",t);let r=localStorage.getItem("sidebarCollapsed");return"true"===r&&ep(!0),()=>{window.removeEventListener("resize",e),window.removeEventListener("sidebarCollapsedChange",t)}},[]);let[eg,eu]=(0,i.useState)("list"),[eh,ef]=(0,i.useState)(new Date),ex=e=>new Date(e.getFullYear(),e.getMonth()+1,0).getDate(),eb=e=>new Date(e.getFullYear(),e.getMonth(),1).getDay(),ev=()=>{ef(new Date(eh.getFullYear(),eh.getMonth()-1))},ew=()=>{ef(new Date(eh.getFullYear(),eh.getMonth()+1))},ey=e=>{let t=e.toISOString().split("T")[0];return k.filter(e=>{if(!e.due_date)return!1;let r=new Date(e.due_date).toISOString().split("T")[0];return r===t})};(0,i.useEffect)(()=>{if(!v){if(!r){e.push("/login");return}ek(),ej(),eN()}},[r,v,e]),(0,i.useEffect)(()=>{eF()},[w,R,W,O]);let ek=async()=>{try{let e=await o.taskService.getUserTasks();y(e)}catch(e){console.error("Failed to fetch tasks:",e),T("Failed to fetch your tasks")}finally{Z(!1)}},ej=async()=>{try{let e=await o.projectService.getProjects();F(e)}catch(e){console.error("Failed to fetch projects:",e)}},eN=async()=>{try{let e=await o.projectService.getUsers();L(e)}catch(e){console.error("Failed to fetch users:",e)}},eF=()=>{let e=[...w];R.trim()&&(e=e.filter(e=>e.name.toLowerCase().includes(R.toLowerCase())||e.description.toLowerCase().includes(R.toLowerCase())||e.project.name.toLowerCase().includes(R.toLowerCase())||e.tags_list.some(e=>e.toLowerCase().includes(R.toLowerCase())))),"overdue"===W?e=e.filter(e=>e_(e.due_date)):"today"===W?e=e.filter(e=>eL(e.due_date)):"this_week"===W?e=e.filter(e=>ez(e.due_date)):"all"!==W&&(e=e.filter(e=>e.status===W)),"all"!==O&&(e=e.filter(e=>e.priority===O)),e.sort((e,t)=>{let r={urgent:0,high:1,medium:2,low:3},a=r[e.priority]??4,i=r[t.priority]??4;if(a!==i)return a-i;if(e.due_date&&t.due_date){let r=new Date(e.due_date).getTime(),a=new Date(t.due_date).getTime();if(r!==a)return r-a}else if(e.due_date&&!t.due_date)return -1;else if(!e.due_date&&t.due_date)return 1;let s=new Date(e.created_at).getTime(),n=new Date(t.created_at).getTime();return s!==n?s-n:e.name.localeCompare(t.name)}),j(e)},eC=async(e,t)=>{try{await o.taskService.updateTaskStatus(e,t);let r=w.find(t=>t.id===e);y(w.map(r=>r.id===e?{...r,status:t}:r)),Y&&Y.id===e&&$({...Y,status:t}),r&&("done"===t?((0,D.c0)("\uD83C\uDF89 Task Completed!",`"${r.name}" has been marked as done`,{urgency:"normal"}),D.Jm.cancelReminder(String(e))):"in_progress"===t&&(0,D.c0)("\uD83D\uDCDD Task Started",`"${r.name}" is now in progress`))}catch(e){T("Failed to update task status")}},eD=async e=>{ee(!0),er(!0);try{let[t,r]=await Promise.all([o.taskService.getTaskComments(e),o.taskService.getTaskAttachments(e).catch(()=>[])]);q(t||[]),J(r||[])}catch(e){console.error("Failed to fetch task details:",e)}finally{ee(!1),er(!1)}},eS=async e=>{if(Y)try{let t=await o.taskService.updateTask(Y.id,e);y(w.map(e=>e.id===Y.id?t:e)),$(t),T("")}catch(e){throw T("Failed to update task"),e}},eE=async e=>{$(e),U(!0),await eD(e.id)},eA=async e=>{try{await o.taskService.deleteTask(e),y(w.filter(t=>t.id!==e)),T("")}catch(e){throw T("Failed to delete task"),e}},e_=e=>{if(!e)return!1;let t=new Date;return t.setHours(0,0,0,0),new Date(e)<t},eL=e=>{if(!e)return!1;let t=new Date,r=new Date(e);return t.toDateString()===r.toDateString()},ez=e=>{if(!e)return!1;let t=new Date,r=new Date(e),a=new Date;return a.setDate(t.getDate()+7),r>=t&&r<=a},eZ=e=>{if(!e)return null;let t=new Date,r=new Date(e),a=r.getTime()-t.getTime();return Math.ceil(a/864e5)},eM=e=>{if(!e)return"";let t=new Date(e);return t.toLocaleDateString("en-US",{month:"short",day:"numeric",year:t.getFullYear()!==new Date().getFullYear()?"numeric":void 0})},eT=e=>E.find(t=>t.value===e)||E[1],eR=e=>S.find(t=>t.value===e)||S[0],eB=(()=>{let e=w.length,t=w.filter(e=>"done"===e.status).length,r=w.filter(e=>e_(e.due_date)).length,a=w.filter(e=>eL(e.due_date)).length;return{total:e,completed:t,overdue:r,dueToday:a}})();return v?a.jsx("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F5F5ED"},children:a.jsx("div",{style:{width:"32px",height:"32px",border:"3px solid #C483D9",borderTop:"3px solid #5884FD",borderRadius:"50%",animation:"spin 1s linear infinite"}})}):r?z?a.jsx("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F5F5ED"},children:a.jsx("div",{style:{width:"32px",height:"32px",border:"3px solid #C483D9",borderTop:"3px solid #5884FD",borderRadius:"50%",animation:"spin 1s linear infinite"}})}):(0,a.jsxs)("div",{children:[a.jsx("style",{dangerouslySetInnerHTML:{__html:`
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
            margin-left: ${ed?"0":em?"72px":"256px"};
            background: transparent;
            padding-top: ${ed?"70px":"0"};
            padding-left: ${ed?"12px":"0"};
            padding-right: ${ed?"12px":"0"};
            transition: margin-left 0.3s ease;
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
        `}}),(0,a.jsxs)("div",{className:"my-tasks-container",children:[a.jsx(b.Z,{projects:N,onCreateProject:()=>{},onCollapsedChange:ep}),(0,a.jsxs)("div",{className:"main-content",children:[(0,a.jsxs)("header",{className:"header",children:[(0,a.jsxs)("div",{className:"header-content",children:[(0,a.jsxs)("div",{children:[a.jsx("h1",{className:"header-title",children:"My Tasks"}),a.jsx("p",{className:"header-subtitle",children:"Manage all your assigned tasks"})]}),(0,a.jsxs)("div",{style:{display:"flex",gap:"0.5rem"},children:[(0,a.jsxs)("button",{onClick:()=>eu("list"),style:{padding:"0.75rem 1.25rem",background:"list"===eg?"#5884FD":"#ffffff",color:"list"===eg?"#ffffff":"#666666",border:"2px solid #e8e8e8",borderRadius:"12px",fontSize:"0.9rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.5rem",transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",letterSpacing:"-0.01em",boxShadow:"list"===eg?"0 4px 12px rgba(88, 132, 253, 0.3)":"0 2px 8px rgba(0, 0, 0, 0.04)"},onMouseEnter:e=>{"list"!==eg&&(e.currentTarget.style.borderColor="#C483D9",e.currentTarget.style.transform="translateY(-1px)",e.currentTarget.style.boxShadow="0 4px 16px rgba(196, 131, 217, 0.15)")},onMouseLeave:e=>{"list"!==eg&&(e.currentTarget.style.borderColor="#e8e8e8",e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)")},children:[a.jsx(l.Z,{style:{width:"16px",height:"16px"}}),"List"]}),(0,a.jsxs)("button",{onClick:()=>eu("calendar"),style:{padding:"0.75rem 1.25rem",background:"calendar"===eg?"#5884FD":"#ffffff",color:"calendar"===eg?"#ffffff":"#666666",border:"2px solid #e8e8e8",borderRadius:"12px",fontSize:"0.9rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.5rem",transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",letterSpacing:"-0.01em",boxShadow:"calendar"===eg?"0 4px 12px rgba(88, 132, 253, 0.3)":"0 2px 8px rgba(0, 0, 0, 0.04)"},onMouseEnter:e=>{"calendar"!==eg&&(e.currentTarget.style.borderColor="#C483D9",e.currentTarget.style.transform="translateY(-1px)",e.currentTarget.style.boxShadow="0 4px 16px rgba(196, 131, 217, 0.15)")},onMouseLeave:e=>{"calendar"!==eg&&(e.currentTarget.style.borderColor="#e8e8e8",e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)")},children:[a.jsx(d.Z,{style:{width:"16px",height:"16px"}}),"Calendar"]})]})]}),(0,a.jsxs)("div",{className:"stats-grid",children:[(0,a.jsxs)("div",{className:"stat-card",children:[a.jsx("div",{style:{width:"48px",height:"48px",background:"#f0f0f0",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem"},children:(0,a.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",style:{color:"#FFB333"},children:[a.jsx("rect",{x:"3",y:"3",width:"8",height:"8",rx:"1",stroke:"currentColor",strokeWidth:"2"}),a.jsx("rect",{x:"13",y:"3",width:"8",height:"8",rx:"1",stroke:"currentColor",strokeWidth:"2"}),a.jsx("rect",{x:"3",y:"13",width:"8",height:"8",rx:"1",stroke:"currentColor",strokeWidth:"2"}),a.jsx("rect",{x:"13",y:"13",width:"8",height:"8",rx:"1",stroke:"currentColor",strokeWidth:"2"})]})}),(0,a.jsxs)("div",{children:[a.jsx("div",{className:"stat-number",style:{color:"#FFB333"},children:eB.total}),a.jsx("div",{className:"stat-label",style:{color:"#666666"},children:"Total Tasks"})]})]}),(0,a.jsxs)("div",{className:"stat-card",children:[a.jsx("div",{style:{width:"48px",height:"48px",background:"#f0f0f0",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem"},children:a.jsx(c.Z,{style:{width:"20px",height:"20px",color:"#10B981"}})}),(0,a.jsxs)("div",{children:[a.jsx("div",{className:"stat-number",style:{color:"#10B981"},children:eB.completed}),a.jsx("div",{className:"stat-label",style:{color:"#666666"},children:"Completed"})]})]}),(0,a.jsxs)("div",{className:"stat-card",children:[a.jsx("div",{style:{width:"48px",height:"48px",background:"#f0f0f0",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem"},children:(0,a.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",style:{color:"#F87239"},children:[a.jsx("circle",{cx:"12",cy:"12",r:"9",stroke:"currentColor",strokeWidth:"2"}),a.jsx("path",{d:"M12 7v6",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round"}),a.jsx("path",{d:"M12 17h.01",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round"})]})}),(0,a.jsxs)("div",{children:[a.jsx("div",{className:"stat-number",style:{color:"#F87239"},children:eB.overdue}),a.jsx("div",{className:"stat-label",style:{color:"#666666"},children:"Overdue"})]})]}),(0,a.jsxs)("div",{className:"stat-card",children:[a.jsx("div",{style:{width:"48px",height:"48px",background:"#f0f0f0",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem"},children:a.jsx(m.Z,{style:{width:"20px",height:"20px",color:"#5884FD"}})}),(0,a.jsxs)("div",{children:[a.jsx("div",{className:"stat-number",style:{color:"#5884FD"},children:eB.dueToday}),a.jsx("div",{className:"stat-label",style:{color:"#666666"},children:"Due Today"})]})]})]})]}),M&&a.jsx("div",{className:"error-message",children:M}),a.jsx("div",{className:"filters-section",children:(0,a.jsxs)("div",{className:"filters-grid",children:[(0,a.jsxs)("div",{className:"filter-group",children:[a.jsx("label",{className:"filter-label",children:"Search Tasks"}),(0,a.jsxs)("div",{style:{position:"relative"},children:[a.jsx("input",{type:"text",className:"search-input",placeholder:"Search by name, description, project, or tags...",value:R,onChange:e=>B(e.target.value)}),a.jsx(p.Z,{style:{position:"absolute",right:"1rem",top:"50%",transform:"translateY(-50%)",width:"18px",height:"18px",color:"#666666",pointerEvents:"none"}})]})]}),(0,a.jsxs)("div",{className:"filter-group",children:[a.jsx("label",{className:"filter-label",children:"Filter by Status"}),a.jsx("select",{className:"filter-select",value:W,onChange:e=>I(e.target.value),children:A.map(e=>a.jsx("option",{value:e.value,children:e.label},e.value))})]}),(0,a.jsxs)("div",{className:"filter-group",children:[a.jsx("label",{className:"filter-label",children:"Filter by Priority"}),(0,a.jsxs)("select",{className:"filter-select",value:O,onChange:e=>H(e.target.value),children:[a.jsx("option",{value:"all",children:"All Priorities"}),E.map(e=>a.jsx("option",{value:e.value,children:e.label},e.value))]})]})]})}),a.jsx("div",{className:"tasks-section",children:"list"===eg?0===k.length?(0,a.jsxs)("div",{style:{background:"#ffffff",border:"1px solid #e8e8e8",borderRadius:"16px",padding:"4rem",textAlign:"center",color:"#666666",boxShadow:"0 2px 16px rgba(0, 0, 0, 0.04)"},children:[a.jsx("div",{style:{width:"64px",height:"64px",background:"#f0f0f0",borderRadius:"16px",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 2rem"},children:(0,a.jsxs)("svg",{width:"32",height:"32",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",style:{color:"#999999"},children:[a.jsx("rect",{x:"3",y:"3",width:"8",height:"8",rx:"1",stroke:"currentColor",strokeWidth:"2"}),a.jsx("rect",{x:"13",y:"3",width:"8",height:"8",rx:"1",stroke:"currentColor",strokeWidth:"2"}),a.jsx("rect",{x:"3",y:"13",width:"8",height:"8",rx:"1",stroke:"currentColor",strokeWidth:"2"}),a.jsx("rect",{x:"13",y:"13",width:"8",height:"8",rx:"1",stroke:"currentColor",strokeWidth:"2"})]})}),a.jsx("h3",{style:{fontSize:"1.5rem",fontWeight:"400",margin:"0 0 1rem 0",color:"#1a1a1a",letterSpacing:"-0.01em"},children:"No tasks found"}),a.jsx("p",{style:{fontSize:"1.1rem",margin:"0",lineHeight:"1.5",color:"#999999"},children:0===w.length?"You don't have any assigned tasks yet.":"No tasks match your current filters. Try adjusting your search or filters."})]}):a.jsx("div",{className:"tasks-list",children:k.map(e=>{let t=eT(e.priority),r=eR(e.status),i=eZ(e.due_date),s=e_(e.due_date),n=null!==i&&i<=3&&i>0;return(0,a.jsxs)("div",{className:`task-item ${s?"overdue":n?"urgent":""}`,onClick:()=>eE(e),children:[(0,a.jsxs)("div",{className:"task-header",children:[(0,a.jsxs)("div",{className:"task-title-section",children:[a.jsx("h3",{className:"task-title",children:e.name}),a.jsx("p",{className:"task-project",children:e.project.name})]}),(0,a.jsxs)("div",{className:"task-actions",children:[(0,a.jsxs)("div",{className:"priority-badge",style:{backgroundColor:t.color+"20",borderColor:t.color,color:t.color},children:[a.jsx("span",{children:t.icon}),a.jsx("span",{children:t.label})]}),(0,a.jsxs)("div",{className:"status-badge",style:{backgroundColor:r.color,borderColor:"#000000",color:"#000000"},children:[a.jsx("span",{children:r.icon}),a.jsx("span",{children:r.label})]}),a.jsx("button",{className:"view-btn",onClick:t=>{t.stopPropagation(),eE(e)},title:"View Details",children:a.jsx(g.Z,{style:{width:"16px",height:"16px"}})})]})]}),e.description&&a.jsx("p",{className:"task-description",children:e.description}),(0,a.jsxs)("div",{className:"task-meta",children:[e.due_date&&(0,a.jsxs)("div",{className:`task-meta-item ${s?"overdue":""}`,children:[a.jsx(d.Z,{style:{width:"14px",height:"14px"}}),a.jsx("span",{children:eM(e.due_date)}),s&&a.jsx("span",{style:{fontWeight:"bold"},children:"(Overdue)"}),n&&(0,a.jsxs)("span",{style:{fontWeight:"bold"},children:["(",i,"d left)"]})]}),(0,a.jsxs)("div",{className:"task-meta-item",children:[a.jsx(u.Z,{style:{width:"14px",height:"14px"}}),(0,a.jsxs)("span",{children:["Created by ",e.created_by.name]})]}),(e.tags_list||[]).length>0&&(0,a.jsxs)("div",{className:"task-meta-item",children:[a.jsx(h.Z,{style:{width:"14px",height:"14px"}}),a.jsx("span",{children:(e.tags_list||[]).slice(0,3).join(", ")}),(e.tags_list||[]).length>3&&(0,a.jsxs)("span",{style:{fontWeight:"bold"},children:["+",(e.tags_list||[]).length-3," more"]})]})]}),a.jsx("div",{className:"task-actions-row",children:S.filter(t=>t.value!==e.status).map(t=>(0,a.jsxs)("button",{onClick:()=>eC(e.id,t.value),className:"status-btn",title:`Move to ${t.label}`,children:[t.icon," ",t.label]},t.value))})]},e.id)})}):(0,a.jsxs)("div",{style:{background:"#ffffff",border:"1px solid #e8e8e8",borderRadius:"16px",padding:"2rem",boxShadow:"0 2px 16px rgba(0, 0, 0, 0.04)"},children:[(0,a.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2rem",padding:"0 1rem"},children:[a.jsx("button",{onClick:()=>ev(),className:"nav-button",style:{display:"flex",alignItems:"center",justifyContent:"center",width:"44px",height:"44px",background:"#ffffff",border:"2px solid #e8e8e8",borderRadius:"12px",cursor:"pointer",color:"#666666",transition:"all 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.borderColor="#5884FD",e.currentTarget.style.color="#5884FD"},onMouseLeave:e=>{e.currentTarget.style.borderColor="#e8e8e8",e.currentTarget.style.color="#666666"},children:a.jsx(f.Z,{style:{width:"20px",height:"20px"}})}),(0,a.jsxs)("h2",{style:{margin:0,fontSize:"1.5rem",fontWeight:"700",color:"#000000",textAlign:"center",flex:1},children:[["January","February","March","April","May","June","July","August","September","October","November","December"][eh.getMonth()]," ",eh.getFullYear()]}),a.jsx("button",{onClick:()=>ew(),className:"nav-button",style:{display:"flex",alignItems:"center",justifyContent:"center",width:"44px",height:"44px",background:"#ffffff",border:"2px solid #e8e8e8",borderRadius:"12px",cursor:"pointer",color:"#666666",transition:"all 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.borderColor="#5884FD",e.currentTarget.style.color="#5884FD"},onMouseLeave:e=>{e.currentTarget.style.borderColor="#e8e8e8",e.currentTarget.style.color="#666666"},children:a.jsx(x.Z,{style:{width:"20px",height:"20px"}})})]}),(0,a.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",gap:"1px",border:"1px solid #e5e7eb",borderRadius:"8px",overflow:"hidden",background:"#e5e7eb"},children:[["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(e=>a.jsx("div",{style:{padding:"1rem",background:"#f8f9fa",fontWeight:"600",textAlign:"center",fontSize:"0.875rem",color:"#374151"},children:e},e)),(()=>{let e=new Date,t=ex(eh),r=eb(eh),i=[];for(let e=0;e<r;e++){let t=new Date(eh.getFullYear(),eh.getMonth()-1),s=ex(t),n=s-r+e+1,o=new Date(eh.getFullYear(),eh.getMonth()-1,n),l=ey(o);i.push((0,a.jsxs)("div",{className:"calendar-day-cell",style:{minHeight:"120px",padding:"0.75rem",background:"#f8f9fa",border:"1px solid #e5e7eb",color:"#9ca3af",opacity:.5},children:[a.jsx("div",{style:{fontSize:"0.875rem",marginBottom:"0.5rem"},children:n}),l.slice(0,2).map((e,t)=>a.jsx("div",{style:{background:"#e5e7eb",padding:"0.25rem 0.5rem",borderRadius:"4px",fontSize:"0.75rem",marginBottom:"0.25rem",cursor:"pointer"},children:e.name.length>15?`${e.name.substring(0,15)}...`:e.name},e.id))]},`prev-${n}`))}for(let r=1;r<=t;r++){let t=new Date(eh.getFullYear(),eh.getMonth(),r),s=ey(t),n=t.toDateString()===e.toDateString();i.push((0,a.jsxs)("div",{className:"calendar-day-cell",style:{minHeight:"120px",padding:"0.75rem",background:n?"#e3f2fd":"#ffffff",border:n?"2px solid #5884FD":"1px solid #e5e7eb",position:"relative"},children:[a.jsx("div",{style:{fontSize:"0.875rem",fontWeight:n?"600":"400",color:n?"#5884FD":"#1f2937",marginBottom:"0.5rem"},children:r}),s.slice(0,3).map((e,t)=>{let r=eT(e.priority),i=e_(e.due_date);return(0,a.jsxs)("div",{onClick:()=>eE(e),style:{background:i?"#fef2f2":"#f8fafc",border:`1px solid ${i?"#f87171":r.color}`,padding:"0.25rem 0.5rem",borderRadius:"4px",fontSize:"0.75rem",marginBottom:"0.25rem",cursor:"pointer",color:i?"#dc2626":"#1f2937",transition:"all 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.transform="translateY(-1px)",e.currentTarget.style.boxShadow="0 2px 4px rgba(0,0,0,0.1)"},onMouseLeave:e=>{e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="none"},children:[a.jsx("div",{style:{fontWeight:"500"},children:e.name.length>15?`${e.name.substring(0,15)}...`:e.name}),a.jsx("div",{style:{fontSize:"0.7rem",color:"#6b7280",marginTop:"0.125rem"},children:e.project.name})]},e.id)}),s.length>3&&(0,a.jsxs)("div",{style:{fontSize:"0.7rem",color:"#6b7280",fontWeight:"500",marginTop:"0.25rem"},children:["+",s.length-3," more tasks"]})]},r))}let s=7*Math.ceil((r+t)/7)-(r+t);for(let e=1;e<=s;e++){let t=new Date(eh.getFullYear(),eh.getMonth()+1,e),r=ey(t);i.push((0,a.jsxs)("div",{className:"calendar-day-cell",style:{minHeight:"120px",padding:"0.75rem",background:"#f8f9fa",border:"1px solid #e5e7eb",color:"#9ca3af",opacity:.5},children:[a.jsx("div",{style:{fontSize:"0.875rem",marginBottom:"0.5rem"},children:e}),r.slice(0,2).map((e,t)=>a.jsx("div",{style:{background:"#e5e7eb",padding:"0.25rem 0.5rem",borderRadius:"4px",fontSize:"0.75rem",marginBottom:"0.25rem",cursor:"pointer"},children:e.name.length>15?`${e.name.substring(0,15)}...`:e.name},e.id))]},`next-${e}`))}return i})()]})]})}),P&&Y&&a.jsx(C,{task:Y,users:_,onClose:()=>{U(!1),$(null)},onSave:eS,onStatusChange:eC,onDelete:eA})]})]})]}):null}},97690:(e,t,r)=>{"use strict";r.d(t,{Z:()=>u});var a=r(53854),i=r(34218),s=r(8041),n=r(67689),o=r(44358),l=r(74448),d=r(2432),c=r(19866),m=r(47485),p=r(18998),g=r(44937);function u({onFileSelect:e,onFolderSelect:t,allowFileSelection:r=!0,allowFolderSelection:u=!0,showCreateFolder:h=!1,mode:f="browse"}){let[x,b]=(0,i.useState)([]),[v,w]=(0,i.useState)(!1),[y,k]=(0,i.useState)([]),[j,N]=(0,i.useState)(null),[F,C]=(0,i.useState)(""),[D,S]=(0,i.useState)(""),[E,A]=(0,i.useState)(!1),[_,L]=(0,i.useState)(null),[z,Z]=(0,i.useState)(!1),[M,T]=(0,i.useState)(""),[R,B]=(0,i.useState)(!1),[W,I]=(0,i.useState)([]),[O,H]=(0,i.useState)(!1),[Y,$]=(0,i.useState)({uploaded:0,total:0,currentFile:""}),P=async(e=null)=>{w(!0),L(null);try{let t=await (0,g.listDriveFiles)(e);return b(t),t}catch(e){return console.error("Error fetching files:",e),L(e instanceof Error?e.message:"Failed to fetch files"),b([]),[]}finally{w(!1)}},U=async(e=null)=>{let t=await P(e),r=t.filter(e=>"application/vnd.google-apps.folder"===e.mimeType);return r.map(t=>({id:t.id,name:t.name,children:[],isExpanded:!1,isLoaded:!1,parentId:e||void 0}))},V=async e=>{let t=await P(e),r=t.filter(e=>"application/vnd.google-apps.folder"===e.mimeType);return r.map(t=>({id:t.id,name:t.name,children:[],isExpanded:!1,isLoaded:!1,parentId:e}))},q=async e=>{let t=r=>r.map(r=>r.id===e?{...r,isExpanded:!r.isExpanded,children:r.isExpanded?r.children:[],isLoaded:!!r.isExpanded&&r.isLoaded}:{...r,children:t(r.children)});k(e=>t(e));let r=(e,t)=>{for(let a of e){if(a.id===t)return a;let e=r(a.children,t);if(e)return e}return null},a=r(y,e);if(a&&!a.isExpanded&&!a.isLoaded){let t=await V(e),r=a=>a.map(a=>a.id===e?{...a,children:t,isLoaded:!0,isExpanded:!0}:{...a,children:r(a.children)});k(e=>r(e))}},G=(e,r)=>{N(e),C(r),t&&t(e,r)},J=async e=>{if(!e.trim()){A(!1);return}w(!0),A(!0),L(null);try{let t=await (0,g.searchDriveFiles)(e);b(t)}catch(e){console.error("Error searching files:",e),L(e instanceof Error?e.message:"Failed to search files"),b([])}finally{w(!1)}},K=async(e,t=null)=>{w(!0);try{let r=await (0,g.createDriveFolder)(e,t||j),a=await U();return k(a),r}catch(e){console.error("Error creating folder:",e),L(e instanceof Error?e.message:"Failed to create folder")}finally{w(!1)}},X=async(e,t)=>{H(!0),$({uploaded:0,total:e.length,currentFile:""});try{let r=await (0,g.uploadMultipleToDrive)(e,t,(e,t,r)=>{$({uploaded:e,total:t,currentFile:r})});B(!1),I([]),$({uploaded:0,total:0,currentFile:""}),e.map(e=>e.name).join(", ");let a=1===e.length?`File "${e[0].name}" uploaded successfully to "${F}"`:`${e.length} files uploaded successfully to "${F}"`;return alert(a),j&&P(j),r}catch(e){console.error("Error uploading files:",e),L(e instanceof Error?e.message:"Failed to upload files")}finally{H(!1),$({uploaded:0,total:0,currentFile:""})}},Q=async()=>{M.trim()&&(await K(M.trim()),Z(!1),T(""))},ee=(e,t=0)=>(0,a.jsxs)("div",{style:{marginLeft:`${20*t}px`},children:[(0,a.jsxs)("div",{className:`folder-tree-item ${j===e.id?"selected":""}`,onClick:()=>G(e.id,e.name),children:[a.jsx("button",{className:"expand-button",onClick:t=>{t.stopPropagation(),q(e.id)},children:e.isExpanded?a.jsx(s.Z,{style:{width:"16px",height:"16px"}}):a.jsx(n.Z,{style:{width:"16px",height:"16px"}})}),a.jsx(o.Z,{className:"folder-icon"}),a.jsx("span",{className:"folder-name",children:e.name}),j===e.id&&a.jsx(l.Z,{className:"selected-icon"})]}),e.isExpanded&&e.children.map(e=>ee(e,t+1))]},e.id);return(0,i.useEffect)(()=>{let e=async()=>{let e=await U();k(e)};e()},[]),(0,a.jsxs)("div",{className:"google-drive-explorer",children:[a.jsx("style",{dangerouslySetInnerHTML:{__html:`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
          
          .google-drive-explorer {
            background: rgba(26, 26, 26, 0.95);
            border: 2px solid rgba(255, 179, 51, 0.3);
            border-radius: 16px;
            overflow: hidden;
            height: 100%;
            max-height: 500px;
            display: flex;
            flex-direction: column;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
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
            background: rgba(26, 26, 26, 0.9);
            backdrop-filter: blur(10px);
            color: #A1A1AA;
            font-weight: 500;
          }
          .drive-search input:focus {
            outline: none;
            border-color: rgba(255, 255, 255, 0.8);
            box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
            background: #1A1A1A;
          }
          .drive-search input::placeholder {
            color: #71717A;
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
            background: rgba(26, 26, 26, 0.9);
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 600;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            color: #A1A1AA;
            backdrop-filter: blur(10px);
          }
          .drive-action-btn:hover {
            border-color: rgba(255, 255, 255, 0.8);
            transform: translateY(-2px);
            background: #1A1A1A;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          }
          .drive-action-btn.primary {
            background: rgba(26, 26, 26, 0.95);
            color: #F87239;
            border-color: rgba(255, 255, 255, 0.8);
            font-weight: 700;
          }
          .drive-action-btn.primary:hover {
            background: #1A1A1A;
            color: #DC2626;
          }
          .drive-action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }
          .selected-folder-info {
            background: #1A1A1A;
            padding: 0.75rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: #A1A1AA;
          }
          .drive-content {
            flex: 1;
            overflow: hidden;
            display: flex;
            min-height: 0;
            background: linear-gradient(135deg, #1A1A1A 0%, #141414 100%);
          }
          .folder-tree-panel {
            width: 50%;
            border-right: 2px solid rgba(255, 179, 51, 0.2);
            padding: 1rem;
            overflow-y: auto;
            max-height: 100%;
            display: flex;
            flex-direction: column;
            background: rgba(26, 26, 26, 0.5);
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
            background: rgba(26, 26, 26, 0.3);
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
            background: #2D2D2D;
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
            background: #3D3D3D;
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
            background: #1F1F1F;
          }
          .folder-tree-item.selected {
            background: #2D2D2D;
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
            color: #71717A;
            font-size: 0.9rem;
          }
          .drive-error {
            padding: 2rem;
            text-align: center;
            color: #dc2626;
            background: #1A1A1A;
            border-bottom: 1px solid #fecaca;
          }

          .drive-file-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            border-bottom: 1px solid #1F1F1F;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .drive-file-item:hover {
            background: #141414;
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
            color: #71717A;
          }
          .drive-file-info {
            flex: 1;
            min-width: 0;
          }
          .drive-file-name {
            font-weight: 500;
            color: #FFFFFF;
            margin-bottom: 0.25rem;
            word-break: break-word;
            font-size: 0.875rem;
          }
          .drive-file-meta {
            font-size: 0.75rem;
            color: #71717A;
          }
          .drive-empty {
            padding: 3rem 1.5rem;
            text-align: center;
            color: #71717A;
          }
          .drive-empty-icon {
            width: 48px;
            height: 48px;
            margin: 0 auto 1rem;
            color: #3D3D3D;
          }
          .search-results {
            width: 100%;
            padding: 1rem;
          }
          .search-info {
            padding: 0.75rem;
            background: #1A1A1A;
            border-bottom: 1px solid #2D2D2D;
            color: #A1A1AA;
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
            background: #1A1A1A;
            border: 2px solid #2D2D2D;
            border-radius: 12px;
            padding: 2rem;
            max-width: 400px;
            width: 100%;
          }
          .dialog-title {
            font-size: 1.25rem;
            font-weight: bold;
            margin-bottom: 1rem;
            color: #FFFFFF;
          }
          .dialog-input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #2D2D2D;
            border-radius: 6px;
            margin-bottom: 1.5rem;
            font-size: 1rem;
          }
          .dialog-input:focus {
            outline: none;
            border-color: #2D2D2D;
            box-shadow: 0 0 0 3px rgba(45, 45, 45, 0.3);
          }
          .file-input {
            margin-bottom: 1rem;
          }
          .file-input input {
            width: 100%;
            padding: 0.75rem;
            border: 2px dashed #2D2D2D;
            border-radius: 6px;
            font-size: 0.9rem;
          }
          .upload-info {
            background: #1A1A1A;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            font-size: 0.875rem;
            color: #A1A1AA;
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
            background: #2D2D2D;
            color: #ffffff;
            border-color: #2D2D2D;
          }
          .dialog-btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
          }
          .dialog-btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }
          .dialog-btn-secondary {
            background: #1A1A1A;
            color: #FFFFFF;
            border-color: #2D2D2D;
          }
          .dialog-btn-secondary:hover {
            border-color: #2D2D2D;
          }
        `}}),(0,a.jsxs)("div",{className:"drive-header",children:[(0,a.jsxs)("div",{className:"drive-search",children:[a.jsx(d.Z,{className:"drive-search-icon"}),a.jsx("input",{type:"text",placeholder:"Search files and folders...",value:D,onChange:e=>{let t=e.target.value;if(S(t),t.trim()){let e=setTimeout(()=>J(t),300);return()=>clearTimeout(e)}A(!1),b([])}})]}),j&&(0,a.jsxs)("div",{className:"selected-folder-info",children:[a.jsx(o.Z,{style:{width:"16px",height:"16px"}}),(0,a.jsxs)("span",{children:["Selected: ",a.jsx("strong",{children:F})]})]}),a.jsx("div",{className:"drive-actions",children:j&&(0,a.jsxs)("button",{onClick:()=>B(!0),className:"drive-action-btn primary",children:[a.jsx(c.Z,{style:{width:"16px",height:"16px"}}),"Upload to ",F]})})]}),(0,a.jsxs)("div",{className:"drive-content",children:[_&&a.jsx("div",{className:"drive-error",children:(0,a.jsxs)("p",{children:["Error: ",_]})}),E?(0,a.jsxs)("div",{className:"search-results",children:[(0,a.jsxs)("div",{className:"search-info",children:['Showing search results for "',D,'"']}),v?a.jsx("div",{className:"drive-loading",children:a.jsx("div",{children:"Searching..."})}):0===x.length?(0,a.jsxs)("div",{className:"drive-empty",children:[a.jsx(m.Z,{className:"drive-empty-icon"}),a.jsx("p",{children:"No files found"})]}):a.jsx("div",{className:"drive-file-list",children:x.map(t=>(0,a.jsxs)("div",{className:"drive-file-item",onClick:()=>{"application/vnd.google-apps.folder"===t.mimeType?G(t.id,t.name):e&&e(t)},children:[a.jsx("div",{className:`drive-file-icon ${"application/vnd.google-apps.folder"===t.mimeType?"folder":"file"}`,children:"application/vnd.google-apps.folder"===t.mimeType?a.jsx(o.Z,{}):a.jsx(m.Z,{})}),(0,a.jsxs)("div",{className:"drive-file-info",children:[a.jsx("div",{className:"drive-file-name",children:t.name}),a.jsx("div",{className:"drive-file-meta",children:"application/vnd.google-apps.folder"===t.mimeType?"Folder":"File"})]})]},t.id))})]}):(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)("div",{className:"folder-tree-panel",children:[(0,a.jsxs)("h3",{className:"panel-title",children:[a.jsx("span",{className:"panel-title-text",children:"\uD83D\uDCC1 Folder Structure"}),h&&(0,a.jsxs)("button",{onClick:()=>Z(!0),className:"new-folder-btn",children:[a.jsx(p.Z,{style:{width:"14px",height:"14px"}}),"New Folder"]})]}),v?a.jsx("div",{className:"drive-loading",children:a.jsx("div",{children:"Loading folders..."})}):0===y.length?(0,a.jsxs)("div",{className:"drive-empty",children:[a.jsx(o.Z,{className:"drive-empty-icon"}),a.jsx("p",{children:"No folders found"})]}):a.jsx("div",{className:"folder-tree",children:y.map(e=>ee(e))})]}),(0,a.jsxs)("div",{className:"files-panel",children:[(0,a.jsxs)("h3",{className:"panel-title",children:["\uD83D\uDCC4 Files ",F&&`in "${F}"`]}),j?a.jsx("div",{children:a.jsx("div",{className:"drive-file-list",children:x.filter(e=>"application/vnd.google-apps.folder"!==e.mimeType).map(t=>(0,a.jsxs)("div",{className:"drive-file-item",onClick:()=>e&&e(t),children:[a.jsx(m.Z,{className:"drive-file-icon file"}),(0,a.jsxs)("div",{className:"drive-file-info",children:[a.jsx("div",{className:"drive-file-name",children:t.name}),a.jsx("div",{className:"drive-file-meta",children:t.size?`${Math.round(parseInt(t.size)/1024)} KB`:"File"})]})]},t.id))})}):(0,a.jsxs)("div",{className:"drive-empty",children:[a.jsx(m.Z,{className:"drive-empty-icon"}),a.jsx("p",{children:"Select a folder to view its files"})]})]})]})]}),z&&a.jsx("div",{className:"dialog-overlay",onClick:()=>Z(!1),children:(0,a.jsxs)("div",{className:"dialog-content",onClick:e=>e.stopPropagation(),children:[a.jsx("h3",{className:"dialog-title",children:"Create New Folder"}),a.jsx("input",{type:"text",className:"dialog-input",placeholder:"Folder name",value:M,onChange:e=>T(e.target.value),onKeyPress:e=>{"Enter"===e.key&&Q()},autoFocus:!0}),(0,a.jsxs)("div",{className:"dialog-actions",children:[a.jsx("button",{onClick:()=>Z(!1),className:"dialog-btn dialog-btn-secondary",children:"Cancel"}),a.jsx("button",{onClick:Q,className:"dialog-btn dialog-btn-primary",disabled:!M.trim(),children:"Create"})]})]})}),R&&a.jsx("div",{className:"dialog-overlay",onClick:()=>B(!1),children:(0,a.jsxs)("div",{className:"dialog-content",onClick:e=>e.stopPropagation(),children:[a.jsx("h3",{className:"dialog-title",children:"Upload File"}),(0,a.jsxs)("div",{className:"upload-info",children:[a.jsx("strong",{children:"Upload to:"})," ",F]}),a.jsx("div",{className:"file-input",children:a.jsx("input",{type:"file",multiple:!0,onChange:e=>{let t=e.target.files;t&&I(Array.from(t))},accept:"*/*"})}),W.length>0&&(0,a.jsxs)("div",{style:{marginBottom:"1rem",fontSize:"0.875rem",color:"#71717A"},children:[a.jsx("div",{style:{marginBottom:"0.5rem"},children:(0,a.jsxs)("strong",{children:["Selected ",W.length," file",1===W.length?"":"s",":"]})}),a.jsx("div",{style:{maxHeight:"150px",overflowY:"auto",background:"#141414",padding:"0.5rem",borderRadius:"4px",border:"1px solid #2D2D2D"},children:W.map((e,t)=>(0,a.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.25rem 0",borderBottom:t<W.length-1?"1px solid #2D2D2D":"none"},children:[a.jsx("span",{style:{flex:1,marginRight:"0.5rem",fontSize:"0.8rem"},children:e.name}),(0,a.jsxs)("span",{style:{fontSize:"0.75rem",color:"#71717A"},children:["(",Math.round(e.size/1024)," KB)"]}),a.jsx("button",{onClick:()=>{let e=W.filter((e,r)=>r!==t);I(e)},style:{marginLeft:"0.5rem",background:"#ef4444",color:"#ffffff",border:"none",borderRadius:"4px",padding:"0.25rem 0.5rem",fontSize:"0.7rem",cursor:"pointer"},children:"Remove"})]},t))}),(0,a.jsxs)("div",{style:{marginTop:"0.5rem",fontSize:"0.75rem",color:"#71717A"},children:["Total size: ",(0,a.jsxs)("strong",{children:[Math.round(W.reduce((e,t)=>e+t.size,0)/1024)," KB"]})]})]}),O&&Y.total>0&&(0,a.jsxs)("div",{style:{marginBottom:"1rem",padding:"0.75rem",background:"#1A1A1A",border:"1px solid #3b82f6",borderRadius:"6px"},children:[(0,a.jsxs)("div",{style:{marginBottom:"0.5rem",fontSize:"0.85rem",fontWeight:"600",color:"#A1A1AA"},children:["Upload Progress: ",Y.uploaded," of ",Y.total," files"]}),a.jsx("div",{style:{width:"100%",height:"8px",background:"#2D2D2D",borderRadius:"4px",overflow:"hidden",marginBottom:"0.5rem"},children:a.jsx("div",{style:{width:`${Y.uploaded/Y.total*100}%`,height:"100%",background:"#3b82f6",transition:"width 0.3s ease"}})}),Y.currentFile&&"Complete"!==Y.currentFile&&(0,a.jsxs)("div",{style:{fontSize:"0.8rem",color:"#71717A"},children:["Currently uploading: ",a.jsx("strong",{children:Y.currentFile})]})]}),(0,a.jsxs)("div",{className:"dialog-actions",children:[a.jsx("button",{onClick:()=>{B(!1),I([])},className:"dialog-btn dialog-btn-secondary",children:"Cancel"}),a.jsx("button",{onClick:()=>{W.length>0&&j&&X(W,j)},className:"dialog-btn dialog-btn-primary",disabled:0===W.length||O,children:O?Y.total>1?`Uploading ${Y.uploaded}/${Y.total} files...`:"Uploading...":`Upload ${W.length} file${1===W.length?"":"s"}`})]})]})})]})}},61702:(e,t,r)=>{"use strict";r.r(t),r.d(t,{$$typeof:()=>n,__esModule:()=>s,default:()=>l});var a=r(95153);let i=(0,a.createProxy)(String.raw`/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/my-tasks/page.tsx`),{__esModule:s,$$typeof:n}=i,o=i.default,l=o},29329:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"}))}),s=i},99374:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"}))}),s=i},62075:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"}))}),s=i},89618:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"}))}),s=i},84063:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"}))}),s=i},20199:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"}))}),s=i},74448:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m4.5 12.75 6 6 9-13.5"}))}),s=i},8041:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m19.5 8.25-7.5 7.5-7.5-7.5"}))}),s=i},10789:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 19.5 8.25 12l7.5-7.5"}))}),s=i},67689:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m8.25 4.5 7.5 7.5-7.5 7.5"}))}),s=i},54791:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"}))}),s=i},19866:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"}))}),s=i},92843:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"}),a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"}))}),s=i},47485:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"}))}),s=i},42150:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"}))}),s=i},90856:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"}),a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"}))}),s=i},44358:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"}))}),s=i},27121:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"}))}),s=i},75908:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"}))}),s=i},61685:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"}))}),s=i},2432:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"}))}),s=i},88930:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"}))}),s=i},70856:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"}))}),s=i},18998:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 4.5v15m7.5-7.5h-15"}))}),s=i},49402:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"}),a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6 6h.008v.008H6V6Z"}))}),s=i},71888:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"}))}),s=i},34148:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"}))}),s=i},69072:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"}))}),s=i},96835:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var a=r(34218);let i=a.forwardRef(function({title:e,titleId:t,...r},i){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6 18 18 6M6 6l12 12"}))}),s=i}};var t=require("../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[3271,2977,1323,7490,7609,7068],()=>r(5392));module.exports=a})();