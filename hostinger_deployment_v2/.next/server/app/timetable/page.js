(()=>{var e={};e.id=5796,e.ids=[5796],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},5403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},4749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},3685:e=>{"use strict";e.exports=require("http")},5687:e=>{"use strict";e.exports=require("https")},1017:e=>{"use strict";e.exports=require("path")},5477:e=>{"use strict";e.exports=require("punycode")},2781:e=>{"use strict";e.exports=require("stream")},7310:e=>{"use strict";e.exports=require("url")},9796:e=>{"use strict";e.exports=require("zlib")},914:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>o.a,__next_app__:()=>p,originalPathname:()=>c,pages:()=>m,routeModule:()=>g,tree:()=>l});var i=r(7096),n=r(6132),a=r(7284),o=r.n(a),s=r(2564),d={};for(let e in s)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>s[e]);r.d(t,d);let l=["",{children:["timetable",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,3344)),"/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/timetable/page.tsx"]}]},{metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,3881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(r.bind(r,6188)),"/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,9291,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,3881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],m=["/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/timetable/page.tsx"],c="/timetable/page",p={require:r,loadChunk:()=>Promise.resolve()},g=new i.AppPageRouteModule({definition:{kind:n.x.APP_PAGE,page:"/timetable/page",pathname:"/timetable",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},5986:(e,t,r)=>{Promise.resolve().then(r.bind(r,5604))},5604:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>F});var i=r(3854),n=r(4218),a=r(1018),o=r(6837),s=r(4937),d=r(4791),l=r(8998),m=r(9618),c=r(856),p=r(1888),g=r(2769),f=r(4448),h=r(6835),x=r(2244),u=r(1685),b=r(6965);let y=n.forwardRef(function({title:e,titleId:t,...r},i){return n.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:i,"aria-labelledby":t},r),e?n.createElement("title",{id:t},e):null,n.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"}))});var v=r(199);class j{async getMeetingNotes(e){try{let t=(await Promise.resolve().then(r.bind(r,2132))).supabase,{data:i,error:n}=await t.from("meeting_notes").select("*").eq("meeting_id",e).single();if(n)return console.error("Error fetching meeting notes:",n),null;return i}catch(e){return console.error("Error in getMeetingNotes:",e),null}}async createMeetingNotes(e){try{let t=(await Promise.resolve().then(r.bind(r,2132))).supabase,{data:i,error:n}=await t.from("meeting_notes").insert([e]).select().single();if(n)throw Error(`Failed to create meeting notes: ${n.message}`);return i}catch(e){throw console.error("Error in createMeetingNotes:",e),e}}async updateMeetingNotes(e,t){try{let i=(await Promise.resolve().then(r.bind(r,2132))).supabase,{data:n,error:a}=await i.from("meeting_notes").update({...t,updated_at:new Date().toISOString()}).eq("id",e).select().single();if(a)throw Error(`Failed to update meeting notes: ${a.message}`);return n}catch(e){throw console.error("Error in updateMeetingNotes:",e),e}}async deleteMeetingNotes(e){try{let t=(await Promise.resolve().then(r.bind(r,2132))).supabase,{error:i}=await t.from("meeting_notes").delete().eq("id",e);if(i)throw Error(`Failed to delete meeting notes: ${i.message}`)}catch(e){throw console.error("Error in deleteMeetingNotes:",e),e}}}let w=new j;function N({meeting:e,onClose:t,projectMembers:r=[]}){let[a,o]=(0,n.useState)({meeting_id:e.id,title:e.title,date:e.date,time:e.time,attendees:e.attendees_list||[],discussion_points:[""],decisions_made:[""],action_items:[""],next_steps:[""],follow_up_date:""}),[s,d]=(0,n.useState)(null),[m,c]=(0,n.useState)(!0),[f,j]=(0,n.useState)(!1),[N,k]=(0,n.useState)(""),[F,_]=(0,n.useState)(null),[z,C]=(0,n.useState)(!1);(0,n.useEffect)(()=>{let t=async()=>{try{let t=await w.getMeetingNotes(e.id);t?(d(t),o({...t,discussion_points:t.discussion_points.length>0?t.discussion_points:[""],decisions_made:t.decisions_made.length>0?t.decisions_made:[""],action_items:t.action_items.length>0?t.action_items:[""],next_steps:t.next_steps.length>0?t.next_steps:[""]}),C(!1)):C(!0)}catch(e){console.error("Failed to load meeting notes:",e),C(!0)}finally{c(!1)}};t()},[e.id]);let S=(e,t)=>{o(r=>{let i=r[e];if(void 0===t)return{...r,[e]:[...i,""]};{let n=[...i];return n.splice(t+1,0,""),{...r,[e]:n}}})},D=(e,t,r)=>{o(i=>{let n=i[e],a=[...n];return a[t]=r,{...i,[e]:a}})},E=(e,t)=>{o(r=>{let i=r[e];if(i.length>1){let n=i.filter((e,r)=>r!==t);return{...r,[e]:n}}return r})},M=()=>{N.trim()&&(o(e=>({...e,attendees:[...e.attendees,N.trim()]})),k(""))},T=e=>{o(t=>({...t,attendees:t.attendees.filter((t,r)=>r!==e)}))},A=e=>{a.attendees.includes(e.name)||o(t=>({...t,attendees:[...t.attendees,e.name]}))},B=async()=>{j(!0);try{let e;let t={...a,discussion_points:a.discussion_points.filter(e=>e.trim()),decisions_made:a.decisions_made.filter(e=>e.trim()),action_items:a.action_items.filter(e=>e.trim()),next_steps:a.next_steps.filter(e=>e.trim()),follow_up_date:a.follow_up_date?.trim()||null};e=s?.id?await w.updateMeetingNotes(s.id,t):await w.createMeetingNotes(t),d(e),o(e),C(!1),alert("Meeting notes saved successfully!")}catch(e){console.error("Failed to save meeting notes:",e),alert("Failed to save meeting notes")}finally{j(!1)}},L=()=>{C(!0)},P=e=>{_(e)};return m?(0,i.jsxs)("div",{className:"modal-overlay",onClick:t,children:[i.jsx("div",{className:"notes-modal",onClick:e=>e.stopPropagation(),children:(0,i.jsxs)("div",{className:"loading-container",children:[i.jsx("div",{className:"loading-spinner"}),i.jsx("p",{children:"Loading meeting notes..."})]})}),i.jsx("style",{dangerouslySetInnerHTML:{__html:`
            .modal-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 1rem;
              z-index: 60;
            }
            .notes-modal {
              background: #ffffff;
              border: 3px solid #000000;
              border-radius: 16px;
              width: 100%;
              max-width: 900px;
              max-height: 90vh;
              overflow-y: auto;
            }
            .loading-container {
              text-align: center;
              padding: 3rem;
              color: #6b7280;
            }
            .loading-spinner {
              width: 40px;
              height: 40px;
              border: 3px solid #e5e7eb;
              border-top: 3px solid #000000;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 1rem;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}})]}):(0,i.jsxs)("div",{className:"modal-overlay",onClick:t,children:[i.jsx("style",{dangerouslySetInnerHTML:{__html:`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 60;
            animation: fadeIn 0.3s ease-out;
          }
          .notes-modal {
            background: #ffffff;
            border: 3px solid #000000;
            border-radius: 16px;
            width: 100%;
            max-width: 900px;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }
          .notes-header {
            padding: 2rem;
            border-bottom: 3px solid #e5e7eb;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            position: relative;
          }
          .notes-title {
            font-size: 2rem;
            font-weight: 800;
            color: #000000;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .close-btn {
            position: absolute;
            top: 1rem;
            right: 1rem;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            background: #ffffff;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #6b7280;
          }
          .close-btn:hover {
            border-color: #000000;
            color: #000000;
            transform: translateY(-1px);
          }
          .notes-content {
            padding: 2rem;
          }
          .form-section {
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: #f8fafc;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
          }
          .section-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #000000;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .form-row-three {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .form-group {
            margin-bottom: 1rem;
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
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.875rem;
            transition: all 0.2s ease;
            box-sizing: border-box;
          }
          .form-input:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .attendees-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1rem;
            min-height: 2rem;
            padding: 0.75rem;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            background: #ffffff;
          }
          .attendee-tag {
            background: #000000;
            color: #ffffff;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: slideInTag 0.2s ease-out;
          }
          .attendee-remove {
            cursor: pointer;
            font-weight: 800;
            font-size: 0.875rem;
            transition: transform 0.1s ease;
          }
          .attendee-remove:hover {
            transform: scale(1.2);
          }
          .attendee-input-row {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
          }
          .add-btn {
            padding: 0.75rem 1rem;
            background: #000000;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .add-btn:hover {
            background: #333333;
            transform: translateY(-1px);
          }
          .project-members {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.5rem;
          }
          .member-btn {
            padding: 0.5rem 0.75rem;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
          }
          .member-btn:hover {
            background: #e5e7eb;
            border-color: #9ca3af;
          }
          .discussion-item {
            display: flex;
            gap: 0.75rem;
            margin-bottom: 1rem;
            align-items: flex-start;
            position: relative;
            width: 100%;
          }
          .discussion-number {
            background: #000000;
            color: #ffffff;
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 700;
            flex-shrink: 0;
            margin-top: 0.5rem;
          }
          .discussion-input {
            flex: 1;
            width: 100%;
            padding: 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.875rem;
            min-height: 80px;
            resize: vertical;
            transition: all 0.2s ease;
            position: relative;
            box-sizing: border-box;
          }
          .discussion-input:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .discussion-input.active {
            border-color: #000000;
            background: #f8fafc;
          }
          .discussion-controls {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .control-btn {
            padding: 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: #ffffff;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .control-btn:hover {
            border-color: #000000;
          }
          .control-btn.add {
            background: #000000;
            color: #ffffff;
            border-color: #000000;
          }
          .control-btn.add:hover {
            background: #333333;
          }
          .previous-line {
            background: #e5e7eb;
            padding: 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            color: #6b7280;
            margin-bottom: 0.5rem;
            font-style: italic;
          }
          .save-section {
            padding: 2rem;
            border-top: 3px solid #e5e7eb;
            background: #f8fafc;
            display: flex;
            justify-content: center;
            gap: 1rem;
          }
          .save-btn {
            padding: 1rem 2rem;
            background: #000000;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1rem;
          }
          .save-btn:hover {
            background: #333333;
            transform: translateY(-2px);
          }
          .save-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            transform: none;
          }
          .cancel-btn {
            padding: 1rem 2rem;
            background: #ffffff;
            color: #000000;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .cancel-btn:hover {
            border-color: #000000;
            transform: translateY(-2px);
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideInTag {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
          /* Document View Styles */
          .document-view {
            max-width: 100%;
            margin: 0 auto;
            background: #ffffff;
            padding: 2rem;
            line-height: 1.6;
            color: #374151;
          }
          .document-header {
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 1.5rem;
            margin-bottom: 2rem;
          }
          .document-title {
            font-size: 2rem;
            font-weight: 800;
            color: #000000;
            margin: 0 0 1rem 0;
            text-align: center;
          }
          .document-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.75rem;
            margin-top: 1rem;
          }
          .meta-item {
            background: #f8fafc;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            font-size: 0.875rem;
            border: 1px solid #e5e7eb;
          }
          .document-section {
            margin-bottom: 2rem;
          }
          .section-heading {
            font-size: 1.25rem;
            font-weight: 700;
            color: #000000;
            margin: 0 0 1rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e5e7eb;
          }
          .attendees-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .attendee-chip {
            background: #000000;
            color: #ffffff;
            padding: 0.375rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
          }
          .discussion-list, .decision-list, .action-list, .next-steps-list {
            margin: 0;
            padding-left: 1.5rem;
          }
          .discussion-item-doc, .decision-item, .action-item, .next-step-item {
            margin-bottom: 0.75rem;
            font-size: 0.95rem;
            line-height: 1.6;
          }
          .action-item {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .action-number {
            background: #000000;
            color: #ffffff;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 700;
            flex-shrink: 0;
            margin-top: 0.125rem;
          }
          .next-step-item {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .step-number {
            color: #000000;
            font-weight: 700;
            font-size: 1.25rem;
            flex-shrink: 0;
          }
          .document-footer {
            border-top: 2px solid #e5e7eb;
            padding-top: 1.5rem;
            text-align: center;
          }
          .edit-btn {
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
          }
          .edit-btn:hover {
            background: #333333;
            transform: translateY(-1px);
          }
        `}}),(0,i.jsxs)("div",{className:"notes-modal",onClick:e=>e.stopPropagation(),children:[(0,i.jsxs)("div",{className:"notes-header",children:[(0,i.jsxs)("h1",{className:"notes-title",children:[i.jsx(x.Z,{style:{width:"2rem",height:"2rem"}}),"Meeting Notes"]}),i.jsx("button",{onClick:t,className:"close-btn",children:i.jsx(h.Z,{style:{width:"1.5rem",height:"1.5rem"}})})]}),i.jsx("div",{className:"notes-content",children:z?(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("h2",{className:"section-title",children:[i.jsx(b.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Meeting Information"]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Meeting Title"}),i.jsx("input",{type:"text",className:"form-input",value:a.title,onChange:e=>o({...a,title:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-row-three",children:[(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Date"}),i.jsx("input",{type:"date",className:"form-input",value:a.date,onChange:e=>o({...a,date:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Time"}),i.jsx("input",{type:"time",className:"form-input",value:a.time,onChange:e=>o({...a,time:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Follow-up Date"}),i.jsx("input",{type:"date",className:"form-input",value:a.follow_up_date||"",onChange:e=>o({...a,follow_up_date:e.target.value})})]})]})]}),(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("h2",{className:"section-title",children:[i.jsx(g.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Attendees"]}),i.jsx("div",{className:"attendees-container",children:a.attendees.map((e,t)=>(0,i.jsxs)("div",{className:"attendee-tag",children:[e,i.jsx("span",{onClick:()=>T(t),className:"attendee-remove",children:"\xd7"})]},t))}),(0,i.jsxs)("div",{className:"attendee-input-row",children:[i.jsx("input",{type:"text",className:"form-input",placeholder:"Add attendee...",value:N,onChange:e=>k(e.target.value),onKeyPress:e=>"Enter"===e.key&&M()}),(0,i.jsxs)("button",{onClick:M,className:"add-btn",children:[i.jsx(l.Z,{style:{width:"1rem",height:"1rem"}}),"Add"]})]}),r.length>0&&(0,i.jsxs)("div",{className:"project-members",children:[i.jsx("span",{style:{fontSize:"0.75rem",color:"#6b7280",marginRight:"0.5rem"},children:"Quick add:"}),r.map((e,t)=>i.jsx("button",{onClick:()=>A(e),className:"member-btn",children:e.name},t))]})]}),(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("h2",{className:"section-title",children:[i.jsx(u.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Key Discussion Points"]}),a.discussion_points.map((e,t)=>(0,i.jsxs)("div",{children:[F===t&&t>0&&(0,i.jsxs)("div",{className:"previous-line",children:["Previous: ",a.discussion_points[t-1]||"No previous discussion point"]}),(0,i.jsxs)("div",{className:"discussion-item",children:[i.jsx("div",{className:"discussion-number",children:t+1}),i.jsx("textarea",{className:`discussion-input ${F===t?"active":""}`,placeholder:"Enter discussion point...",value:e,onChange:e=>D("discussion_points",t,e.target.value),onFocus:()=>P(t)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>S("discussion_points",t),className:"control-btn add",title:"Add discussion point after this one",children:i.jsx(l.Z,{style:{width:"1rem",height:"1rem"}})}),a.discussion_points.length>1&&i.jsx("button",{onClick:()=>E("discussion_points",t),className:"control-btn",title:"Remove this discussion point",children:i.jsx(p.Z,{style:{width:"1rem",height:"1rem"}})}),t>0&&i.jsx("button",{onClick:()=>_(F===t?null:t),className:"control-btn",title:"Show previous line",children:i.jsx(y,{style:{width:"1rem",height:"1rem"}})})]})]})]},t))]}),(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("h2",{className:"section-title",children:[i.jsx(v.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Decisions Made"]}),a.decisions_made.map((e,t)=>(0,i.jsxs)("div",{className:"discussion-item",children:[(0,i.jsxs)("div",{className:"discussion-number",children:["D",t+1]}),i.jsx("textarea",{className:"discussion-input",placeholder:"Enter decision made...",value:e,onChange:e=>D("decisions_made",t,e.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>S("decisions_made",t),className:"control-btn add",children:i.jsx(l.Z,{style:{width:"1rem",height:"1rem"}})}),a.decisions_made.length>1&&i.jsx("button",{onClick:()=>E("decisions_made",t),className:"control-btn",children:i.jsx(p.Z,{style:{width:"1rem",height:"1rem"}})})]})]},t))]}),(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("h2",{className:"section-title",children:[i.jsx(x.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Action Items"]}),a.action_items.map((e,t)=>(0,i.jsxs)("div",{className:"discussion-item",children:[(0,i.jsxs)("div",{className:"discussion-number",children:["A",t+1]}),i.jsx("textarea",{className:"discussion-input",placeholder:"Enter action item...",value:e,onChange:e=>D("action_items",t,e.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>S("action_items",t),className:"control-btn add",children:i.jsx(l.Z,{style:{width:"1rem",height:"1rem"}})}),a.action_items.length>1&&i.jsx("button",{onClick:()=>E("action_items",t),className:"control-btn",children:i.jsx(p.Z,{style:{width:"1rem",height:"1rem"}})})]})]},t))]}),(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("h2",{className:"section-title",children:[i.jsx(x.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Next Steps"]}),a.next_steps.map((e,t)=>(0,i.jsxs)("div",{className:"discussion-item",children:[(0,i.jsxs)("div",{className:"discussion-number",children:["N",t+1]}),i.jsx("textarea",{className:"discussion-input",placeholder:"Enter next step...",value:e,onChange:e=>D("next_steps",t,e.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>S("next_steps",t),className:"control-btn add",children:i.jsx(l.Z,{style:{width:"1rem",height:"1rem"}})}),a.next_steps.length>1&&i.jsx("button",{onClick:()=>E("next_steps",t),className:"control-btn",children:i.jsx(p.Z,{style:{width:"1rem",height:"1rem"}})})]})]},t))]})]}):i.jsx(()=>(0,i.jsxs)("div",{className:"document-view",children:[(0,i.jsxs)("div",{className:"document-header",children:[i.jsx("h1",{className:"document-title",children:"Meeting Notes"}),(0,i.jsxs)("div",{className:"document-meta",children:[(0,i.jsxs)("span",{className:"meta-item",children:[i.jsx("strong",{children:"Meeting:"})," ",a.title]}),(0,i.jsxs)("span",{className:"meta-item",children:[i.jsx("strong",{children:"Date:"})," ",(()=>{let[e,t,r]=a.date.split("-").map(Number),i=new Date(e,t-1,r);return i.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})})()]}),(0,i.jsxs)("span",{className:"meta-item",children:[i.jsx("strong",{children:"Time:"})," ",a.time]}),a.follow_up_date&&(0,i.jsxs)("span",{className:"meta-item",children:[i.jsx("strong",{children:"Follow-up Date:"})," ",(()=>{let[e,t,r]=a.follow_up_date.split("-").map(Number),i=new Date(e,t-1,r);return i.toLocaleDateString()})()]})]})]}),a.attendees.length>0&&(0,i.jsxs)("div",{className:"document-section",children:[i.jsx("h3",{className:"section-heading",children:"Attendees"}),i.jsx("div",{className:"attendees-grid",children:a.attendees.map((e,t)=>i.jsx("span",{className:"attendee-chip",children:e},t))})]}),a.discussion_points.filter(e=>e.trim()).length>0&&(0,i.jsxs)("div",{className:"document-section",children:[i.jsx("h3",{className:"section-heading",children:"Key Discussion Points"}),i.jsx("ol",{className:"discussion-list",children:a.discussion_points.filter(e=>e.trim()).map((e,t)=>i.jsx("li",{className:"discussion-item-doc",children:e},t))})]}),a.decisions_made.filter(e=>e.trim()).length>0&&(0,i.jsxs)("div",{className:"document-section",children:[i.jsx("h3",{className:"section-heading",children:"Decisions Made"}),i.jsx("ul",{className:"decision-list",children:a.decisions_made.filter(e=>e.trim()).map((e,t)=>i.jsx("li",{className:"decision-item",children:e},t))})]}),a.action_items.filter(e=>e.trim()).length>0&&(0,i.jsxs)("div",{className:"document-section",children:[i.jsx("h3",{className:"section-heading",children:"Action Items"}),i.jsx("ul",{className:"action-list",children:a.action_items.filter(e=>e.trim()).map((e,t)=>(0,i.jsxs)("li",{className:"action-item",children:[(0,i.jsxs)("span",{className:"action-number",children:["A",t+1]}),e]},t))})]}),a.next_steps.filter(e=>e.trim()).length>0&&(0,i.jsxs)("div",{className:"document-section",children:[i.jsx("h3",{className:"section-heading",children:"Next Steps"}),i.jsx("ul",{className:"next-steps-list",children:a.next_steps.filter(e=>e.trim()).map((e,t)=>(0,i.jsxs)("li",{className:"next-step-item",children:[i.jsx("span",{className:"step-number",children:"→"}),e]},t))})]}),i.jsx("div",{className:"document-footer",children:(0,i.jsxs)("button",{onClick:L,className:"edit-btn",children:[i.jsx(x.Z,{style:{width:"1rem",height:"1rem"}}),"Edit Notes"]})})]}),{})}),z&&(0,i.jsxs)("div",{className:"save-section",children:[(0,i.jsxs)("button",{onClick:B,className:"save-btn",disabled:f,children:[i.jsx(x.Z,{style:{width:"1.25rem",height:"1.25rem"}}),f?"Saving...":"Save Meeting Notes"]}),i.jsx("button",{onClick:()=>{s?(o(s),C(!1)):t()},className:"cancel-btn",children:"Cancel"})]})]})]})}function k({meeting:e,onClose:t,onUpdate:a,onDelete:o,projectMembers:s=[],projects:l=[],onProjectChange:y}){let[v,j]=(0,n.useState)(!1),[w,k]=(0,n.useState)(!1),[F,_]=(0,n.useState)({title:e.title,description:e.description,date:e.date,time:e.time,duration:e.duration,project_id:e.project_id||0,attendees:e.attendees||"",attendee_ids:e.attendee_ids||[]});(0,n.useEffect)(()=>{v&&F.project_id&&y&&y(F.project_id)},[F.project_id,v,y]);let z=async()=>{try{await a({...F,project:F.project_id,attendee_ids:F.attendee_ids.length>0?F.attendee_ids:void 0}),j(!1)}catch(e){console.error("Failed to update meeting:",e)}},C=async()=>{if(window.confirm("Are you sure you want to delete this meeting?"))try{await o(e.id),t()}catch(e){console.error("Failed to delete meeting:",e)}},[S,D]=(0,n.useState)([]),[E,M]=(0,n.useState)([]);return(0,n.useEffect)(()=>{let e=async()=>{try{let{userService:e}=await Promise.resolve().then(r.bind(r,4937)),t=await e.getUsers();M(t||[])}catch(e){console.error("Failed to fetch users:",e),M([])}};e()},[]),(0,n.useEffect)(()=>{if(e.attendee_ids&&e.attendee_ids.length>0&&E.length>0){let t=e.attendee_ids.map(e=>{let t=E.find(t=>t.id===e);if(t)return t.name||t.email?.split("@")[0]||"Unknown User";let r=s.find(t=>t.id===e);return r?r.name:`User ${e}`});D(t)}else e.attendees_list&&e.attendees_list.length>0?D(e.attendees_list):e.attendees&&"string"==typeof e.attendees?D(e.attendees.split(",").map(e=>e.trim()).filter(e=>e)):D([])},[e.attendee_ids,e.attendees_list,e.attendees,s,E]),(0,i.jsxs)("div",{className:"modal-overlay",onClick:t,children:[i.jsx("style",{dangerouslySetInnerHTML:{__html:`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 50;
            animation: fadeIn 0.3s ease-out;
          }
          .meeting-modal {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            width: 100%;
            max-width: 450px;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            margin: 0 auto;
          }
          .meeting-modal-fixed {
            border: 1px solid #e5e7eb !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
            max-width: 450px !important;
            background: #ffffff !important;
          }
          .modal-content {
            padding: 0;
            border: none !important;
            box-shadow: none !important;
          }
          .modal-header {
            padding: 1rem;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            background: #f8fafc;
          }
          .modal-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #000000;
            margin: 0;
            flex: 1;
            margin-right: 1rem;
          }
          .modal-actions {
            display: flex;
            gap: 0.5rem;
            flex-shrink: 0;
          }
          .action-btn {
            padding: 0.5rem;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            background: #ffffff;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .action-btn:hover {
            border-color: #000000;
            transform: translateY(-1px);
          }
          .action-btn.edit { background: #f3f4f6; }
          .action-btn.save { background: #000000; color: #ffffff; }
          .action-btn.delete { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
          .action-btn.close { background: #fef2f2; border-color: #fecaca; }
          .modal-body {
            padding: 1rem;
          }
          .meeting-info {
            display: grid;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }
          .info-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.6rem;
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          }
          .info-icon {
            color: #6b7280;
            flex-shrink: 0;
          }
          .info-content {
            flex: 1;
          }
          .info-label {
            font-size: 0.75rem;
            color: #6b7280;
            margin-bottom: 0.25rem;
          }
          .info-value {
            font-weight: 600;
            color: #000000;
            font-size: 0.875rem;
          }
          .form-group {
            margin-bottom: 1rem;
          }
          .form-label {
            display: block;
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
          }
          .form-input, .form-textarea, .form-select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            font-size: 0.875rem;
            transition: border-color 0.2s ease;
            box-sizing: border-box;
          }
          .form-input:focus, .form-textarea:focus, .form-select:focus {
            outline: none;
            border-color: #000000;
          }
          .form-grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 140px;
            gap: 1rem;
          }
          .meeting-notes-section {
            padding-top: 1rem;
            margin-top: 1rem;
            margin-bottom: 1rem;
            width: 100%;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .notes-header {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 1rem;
            gap: 1rem;
          }
          .notes-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #000000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .toggle-notes-btn {
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.875rem;
          }
          .toggle-notes-btn:hover {
            background: #333333;
          }
          .form-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
          }
          .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 2px solid transparent;
          }
          .btn-primary {
            background: #000000;
            color: #ffffff;
          }
          .btn-primary:hover {
            background: #333333;
          }
          .btn-secondary {
            background: #ffffff;
            color: #000000;
            border-color: #e5e7eb;
          }
          .btn-secondary:hover {
            border-color: #000000;
          }
          .attendees-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
          }
          .attendee-tag {
            background: #000000;
            color: #ffffff;
            padding: 0.25rem 0.5rem;
            border-radius: 10px;
            font-size: 0.7rem;
            font-weight: 500;
          }
          @media (max-width: 768px) {
            .meeting-modal {
              max-width: 95vw;
              margin: 1rem;
            }
            .form-grid-3 {
              grid-template-columns: 1fr;
            }
            .modal-header {
              padding: 0.75rem;
            }
            .modal-body {
              padding: 0.75rem;
            }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}}),(0,i.jsxs)("div",{className:"meeting-modal meeting-modal-fixed",onClick:e=>e.stopPropagation(),children:[(0,i.jsxs)("div",{className:"modal-header",children:[i.jsx("h2",{className:"modal-title",children:v?"Edit Meeting":e.title}),(0,i.jsxs)("div",{className:"modal-actions",children:[v?i.jsx("button",{onClick:z,className:"action-btn save",title:"Save changes",children:i.jsx(f.Z,{style:{width:"16px",height:"16px"}})}):(0,i.jsxs)(i.Fragment,{children:[i.jsx("button",{onClick:()=>j(!0),className:"action-btn edit",title:"Edit meeting",children:i.jsx(c.Z,{style:{width:"16px",height:"16px"}})}),i.jsx("button",{onClick:C,className:"action-btn delete",title:"Delete meeting",children:i.jsx(p.Z,{style:{width:"16px",height:"16px"}})})]}),i.jsx("button",{onClick:t,className:"action-btn close",title:"Close",children:i.jsx(h.Z,{style:{width:"16px",height:"16px"}})})]})]}),i.jsx("div",{className:"modal-content",children:(0,i.jsxs)("div",{className:"modal-body",children:[v?(0,i.jsxs)("div",{className:"edit-form",children:[(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Meeting Title *"}),i.jsx("input",{type:"text",required:!0,className:"form-input",placeholder:"Enter meeting title...",value:F.title,onChange:e=>_({...F,title:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Description"}),i.jsx("textarea",{className:"form-textarea",placeholder:"What will be discussed in this meeting?",value:F.description,onChange:e=>_({...F,description:e.target.value}),style:{minHeight:"80px",resize:"vertical"}})]}),l.length>0&&(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Project *"}),(0,i.jsxs)("select",{required:!0,className:"form-select",value:F.project_id,onChange:e=>_({...F,project_id:Number(e.target.value),attendee_ids:[]}),children:[i.jsx("option",{value:0,children:"Select a project"}),l.map(e=>i.jsx("option",{value:e.id,children:e.name},e.id))]})]}),(0,i.jsxs)("div",{className:"form-grid-3",children:[(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Date *"}),i.jsx("input",{type:"date",required:!0,className:"form-input",value:F.date,onChange:e=>_({...F,date:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Time *"}),i.jsx("input",{type:"time",required:!0,className:"form-input",value:F.time,onChange:e=>_({...F,time:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Duration"}),i.jsx("input",{type:"number",min:"15",max:"480",step:"15",className:"form-input",placeholder:"Minutes",value:F.duration,onChange:e=>_({...F,duration:Number(e.target.value)})})]})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Invite Attendees (Optional)"}),F.attendee_ids.length>0&&i.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.5rem",marginBottom:"0.75rem",padding:"0.75rem",backgroundColor:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"6px"},children:F.attendee_ids.map(e=>{let t=s.find(t=>t.id===e);return t?(0,i.jsxs)("span",{style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.25rem 0.75rem",backgroundColor:"#000000",color:"#ffffff",borderRadius:"20px",fontSize:"0.875rem"},children:[t.name,i.jsx("button",{type:"button",onClick:()=>_(t=>({...t,attendee_ids:t.attendee_ids.filter(t=>t!==e)})),style:{background:"none",border:"none",color:"#ffffff",cursor:"pointer",fontSize:"1rem",lineHeight:"1"},children:"\xd7"})]},e):null})}),s.length>0?i.jsx("div",{style:{border:"2px solid #e5e7eb",borderRadius:"6px",maxHeight:"200px",overflowY:"auto"},children:s.map(e=>{let t=F.attendee_ids.includes(e.id);return(0,i.jsxs)("div",{onClick:()=>{_(r=>({...r,attendee_ids:t?r.attendee_ids.filter(t=>t!==e.id):[...r.attendee_ids,e.id]}))},style:{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",borderBottom:"1px solid #e5e7eb",cursor:"pointer",backgroundColor:t?"#f0f9ff":"#ffffff",borderLeft:t?"4px solid #000000":"4px solid transparent"},children:[i.jsx("input",{type:"checkbox",checked:t,onChange:()=>{},style:{cursor:"pointer"}}),(0,i.jsxs)("div",{style:{flex:1},children:[i.jsx("div",{style:{fontWeight:"500",color:"#000000"},children:e.name}),i.jsx("div",{style:{fontSize:"0.875rem",color:"#6b7280"},children:e.email})]})]},e.id)})}):i.jsx("div",{style:{padding:"2rem",textAlign:"center",color:"#6b7280",border:"2px dashed #e5e7eb",borderRadius:"6px"},children:F.project_id?"Loading project members...":"Select a project to see available members"})]}),(0,i.jsxs)("div",{className:"form-actions",children:[i.jsx("button",{onClick:z,className:"btn btn-primary",children:"Update Meeting"}),i.jsx("button",{onClick:()=>j(!1),className:"btn btn-secondary",children:"Cancel"})]})]}):(0,i.jsxs)("div",{className:"meeting-info",children:[(0,i.jsxs)("div",{className:"info-row",children:[i.jsx(m.Z,{className:"info-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Date"}),i.jsx("div",{className:"info-value",children:(e=>{let[t,r,i]=e.split("-").map(Number),n=new Date(t,r-1,i);return n.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})})(e.date)})]})]}),(0,i.jsxs)("div",{className:"info-row",children:[i.jsx(d.Z,{className:"info-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Time & Duration"}),(0,i.jsxs)("div",{className:"info-value",children:[(e=>{let[t,r]=e.split(":"),i=new Date;return i.setHours(parseInt(t),parseInt(r)),i.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0})})(e.time)," • ",(e=>{let t=Math.floor(e/60),r=e%60;return t>0?r>0?`${t}h ${r}m`:`${t}h`:`${r}m`})(e.duration)]})]})]}),(0,i.jsxs)("div",{className:"info-row",children:[i.jsx(x.Z,{className:"info-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Project"}),i.jsx("div",{className:"info-value",children:e.project_name})]})]}),e.description&&(0,i.jsxs)("div",{className:"info-row",children:[i.jsx(u.Z,{className:"info-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Description"}),i.jsx("div",{className:"info-value",children:e.description})]})]}),S.length>0&&(0,i.jsxs)("div",{className:"info-row",children:[i.jsx(g.Z,{className:"info-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Attendees"}),i.jsx("div",{className:"attendees-list",children:S.map((e,t)=>i.jsx("span",{className:"attendee-tag",children:e},t))})]})]})]}),i.jsx("div",{className:"meeting-notes-section",children:(0,i.jsxs)("div",{className:"notes-header",children:[(0,i.jsxs)("div",{className:"notes-title",children:[i.jsx(b.Z,{style:{width:"20px",height:"20px"}}),"Meeting Notes"]}),i.jsx("button",{onClick:()=>k(!0),className:"toggle-notes-btn",children:"Meeting Notes"})]})})]})})]}),w&&i.jsx(N,{meeting:{id:e.id,title:e.title,date:e.date,time:e.time,duration:e.duration,attendees_list:S},onClose:()=>k(!1),projectMembers:s})]})}function F(){let{user:e,isAuthenticated:t,isLoading:r}=(0,o.useAuth)(),f=(0,a.useRouter)(),[h,x]=(0,n.useState)([]),[u,b]=(0,n.useState)([]),[y,v]=(0,n.useState)([]),[j,w]=(0,n.useState)([]),[N,F]=(0,n.useState)(new Set),[_,z]=(0,n.useState)(!0),[C,S]=(0,n.useState)(""),[D,E]=(0,n.useState)(!1),[M,T]=(0,n.useState)(null),[A,B]=(0,n.useState)(null),[L,P]=(0,n.useState)(!1),[R,I]=(0,n.useState)(0),[Z,W]=(0,n.useState)("calendar"),[Y,O]=(0,n.useState)("month"),[U,$]=(0,n.useState)(new Date),[H,q]=(0,n.useState)(!1),[G,V]=(0,n.useState)([]),[J,K]=(0,n.useState)(!1);(0,n.useEffect)(()=>{let e=()=>{K(window.innerWidth<768)};return e(),window.addEventListener("resize",e),()=>window.removeEventListener("resize",e)},[]);let[X,Q]=(0,n.useState)(null),[ee,et]=(0,n.useState)({title:"",description:"",date:"",time:"",duration:60,project_id:0,attendees:"",attendee_ids:[]});(0,n.useEffect)(()=>{if(!r){if(!t){f.push("/login");return}er()}},[t,r,f]),(0,n.useEffect)(()=>{ee.project_id>0?(ei(ee.project_id),et(e=>({...e,attendee_ids:[]}))):w([])},[ee.project_id]);let er=async()=>{try{S(""),console.log("Timetable: Fetching data for user:",e?.id);let[t,r,i,n]=await Promise.all([s.projectService.getProjects(),s.wG.getMeetings(),s.projectService.getUsers(),s.OV.getUserTasks()]);console.log("Timetable: Fetched projects:",t?.length||0),console.log("Timetable: Fetched meetings:",r?.length||0),console.log("Timetable: Fetched users:",i?.length||0);let a=new Set;t.forEach(e=>{a.add(e.id)}),n.forEach(t=>{(t.assignee?.id===e?.id||t.created_by?.id===e?.id)&&a.add(t.project_id)});let o=r.filter(t=>{let r=t.project_id||t.project;if("personal"===t.event_type||!r)return t.created_by?.id===e?.id;if(!a.has(r))return!1;if(t.created_by?.id===e?.id||t.attendee_ids&&Array.isArray(t.attendee_ids)&&e?.id&&t.attendee_ids.includes(e.id))return!0;let i=t.attendees_list||(t.attendees?t.attendees.split(",").map(e=>e.trim()):[]),n=i.some(t=>t.toLowerCase().includes(e?.name?.toLowerCase()||"")||t.toLowerCase().includes(e?.email?.toLowerCase()||""));return!!n});F(a),x(t||[]),b(o||[]),v(i||[]),console.log("Timetable: Data loaded successfully")}catch(t){let e=t instanceof Error?t.message:"Failed to load timetable data";S(e),console.error("Timetable: Fetch error:",t)}finally{z(!1)}},ei=async e=>{try{let t=await s.projectService.getProjectMembers(e);w(t)}catch(e){console.error("Error fetching project members:",e),w([])}},en=async e=>{if(e.preventDefault(),!ee.title.trim()||!ee.date||!ee.time||!ee.project_id){S("Please fill in all required fields");return}if(!N.has(ee.project_id)){S("You do not have access to create meetings for this project");return}try{let e={title:ee.title.trim(),description:ee.description.trim(),project:ee.project_id,date:ee.date,time:ee.time,duration:ee.duration,attendees:ee.attendees,attendee_ids:ee.attendee_ids.length>0?ee.attendee_ids:void 0},t=await s.wG.createMeeting(e);b([t,...u]),et({title:"",description:"",date:"",time:"",duration:60,project_id:0,attendees:"",attendee_ids:[]}),E(!1),S("")}catch(e){S("Failed to create meeting")}},ea=e=>{B(e),P(!0)},eo=async e=>{if(!A)return;let t=A.project_id||A.project;if(!t||!N.has(t)){S("You do not have access to update this meeting");return}try{let t=await s.wG.updateMeeting(A.id,{title:e.title.trim(),description:e.description.trim(),date:e.date,time:e.time,duration:e.duration,attendees:e.attendees});b(u.map(e=>e.id===A.id?t:e)),B(t),S("")}catch(e){S("Failed to update meeting")}},es=async e=>{try{await em(e),P(!1),B(null)}catch(e){}},ed=e=>{let t=e.project_id||e.project;if(!t||!N.has(t)){S("You do not have access to edit this meeting");return}T(e),et({title:e.title,description:e.description,date:e.date,time:e.time,duration:e.duration,project_id:e.project_id||e.project||0,attendees:e.attendees_list?e.attendees_list.join(", "):e.attendees||"",attendee_ids:[]}),E(!0)},el=async e=>{if(e.preventDefault(),M){if(!N.has(ee.project_id)){S("You do not have access to update meetings for this project");return}try{let e={title:ee.title.trim(),description:ee.description.trim(),project:ee.project_id,date:ee.date,time:ee.time,duration:ee.duration,attendees:ee.attendees,attendee_ids:ee.attendee_ids.length>0?ee.attendee_ids:void 0},t=await s.wG.updateMeeting(M.id,e);b(u.map(e=>e.id===M.id?t:e)),T(null),et({title:"",description:"",date:"",time:"",duration:60,project_id:0,attendees:"",attendee_ids:[]}),E(!1),S("")}catch(e){S("Failed to update meeting")}}},em=async e=>{try{let t=u.find(t=>t.id===e);if(!t){S("Meeting not found");return}let r=t.project_id||t.project;if(!r||!N.has(r)){S("You do not have access to delete this meeting");return}await s.wG.deleteMeeting(e),b(u.filter(t=>t.id!==e))}catch(e){S("Failed to delete meeting")}},ec=e=>{let[t,r,i]=e.split("-").map(Number),n=new Date(t,r-1,i);return n.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})},ep=e=>{let[t,r]=e.split(":"),i=new Date;return i.setHours(parseInt(t),parseInt(r)),i.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0})},eg=e=>{let t=Math.floor(e/60),r=e%60;return t>0?r>0?`${t}h ${r}m`:`${t}h`:`${r}m`},ef=u.filter(e=>{let[t,r,i]=e.date.split("-").map(Number),[n,a]=e.time.split(":").map(Number),o=new Date(t,r-1,i,n,a);return o>=new Date}).sort((e,t)=>{let[r,i,n]=e.date.split("-").map(Number),[a,o]=e.time.split(":").map(Number),s=new Date(r,i-1,n,a,o),[d,l,m]=t.date.split("-").map(Number),[c,p]=t.time.split(":").map(Number),g=new Date(d,l-1,m,c,p);return s.getTime()-g.getTime()}),eh=u.filter(e=>{let[t,r,i]=e.date.split("-").map(Number),[n,a]=e.time.split(":").map(Number),o=new Date(t,r-1,i,n,a);return o<new Date}).sort((e,t)=>{let[r,i,n]=e.date.split("-").map(Number),[a,o]=e.time.split(":").map(Number),s=new Date(r,i-1,n,a,o),[d,l,m]=t.date.split("-").map(Number),[c,p]=t.time.split(":").map(Number),g=new Date(d,l-1,m,c,p);return g.getTime()-s.getTime()}),ex=e=>new Date(e.getFullYear(),e.getMonth()+1,0).getDate(),eu=e=>new Date(e.getFullYear(),e.getMonth(),1).getDay(),eb=e=>{let t=e.getFullYear(),r=String(e.getMonth()+1).padStart(2,"0"),i=String(e.getDate()).padStart(2,"0"),n=`${t}-${r}-${i}`;return u.filter(e=>e.date===n)},ey=e=>{let t=new Date(e),r=t.getDay();t.setDate(t.getDate()-r);let i=[];for(let e=0;e<7;e++){let r=new Date(t);r.setDate(t.getDate()+e),i.push(r)}return i},ev=e=>e.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}),ej=()=>{if("month"===Y)$(new Date(U.getFullYear(),U.getMonth()-1));else if("week"===Y){let e=new Date(U);e.setDate(e.getDate()-7),$(e)}else if("day"===Y){let e=new Date(U);e.setDate(e.getDate()-1),$(e)}},ew=()=>{if("month"===Y)$(new Date(U.getFullYear(),U.getMonth()+1));else if("week"===Y){let e=new Date(U);e.setDate(e.getDate()+7),$(e)}else if("day"===Y){let e=new Date(U);e.setDate(e.getDate()+1),$(e)}},eN=new Date,ek=(0,n.useMemo)(()=>ex(U),[U]),eF=(0,n.useMemo)(()=>eu(U),[U]),e_=e=>e.attendees_list&&e.attendees_list.length>0?e.attendees_list:e.attendees&&"string"==typeof e.attendees?e.attendees.split(",").map(e=>e.trim()).filter(e=>e):[],ez=(e,t)=>{Q(e),V(t),q(!0)};return r?i.jsx("div",{style:{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F5F5ED"},children:i.jsx("div",{style:{width:"32px",height:"32px",border:"3px solid #C483D9",borderTop:"3px solid #5884FD",borderRadius:"50%",animation:"spin 1s linear infinite"}})}):t?_?i.jsx("div",{style:{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F5F5ED"},children:i.jsx("div",{style:{width:"32px",height:"32px",border:"3px solid #C483D9",borderTop:"3px solid #5884FD",borderRadius:"50%",animation:"spin 1s linear infinite"}})}):(0,i.jsxs)("div",{children:[i.jsx("style",{dangerouslySetInnerHTML:{__html:`
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
            background: transparent;
            max-width: ${J?"100vw":"calc(100vw - 280px)"};
            overflow-x: hidden;
            box-sizing: border-box;
            position: relative;
            z-index: 1;
            padding-top: ${J?"70px":"0"};
            padding-left: ${J?"12px":"0"};
            padding-right: ${J?"12px":"0"};
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
        `}}),(0,i.jsxs)("main",{className:"main-content",children:[(0,i.jsxs)("header",{className:"header",children:[(0,i.jsxs)("div",{className:"header-content",children:[(0,i.jsxs)("div",{children:[(0,i.jsxs)("h1",{className:"header-title",children:[i.jsx(d.Z,{style:{width:"32px",height:"32px"}}),"Timetable & Meetings"]}),i.jsx("p",{style:{color:"#666666",fontSize:"1.1rem",margin:"0.5rem 0 0 0",lineHeight:"1.5"},children:"Schedule and manage team meetings across all projects"})]}),(0,i.jsxs)("div",{className:"header-controls",children:[(0,i.jsxs)("div",{className:"filter-controls",children:[i.jsx("button",{onClick:()=>W("list"),className:`filter-btn ${"list"===Z?"active":""}`,children:"List View"}),i.jsx("button",{onClick:()=>W("calendar"),className:`filter-btn ${"calendar"===Z?"active":""}`,children:"Calendar View"})]}),(0,i.jsxs)("button",{onClick:()=>E(!0),className:"create-button",children:[i.jsx(l.Z,{style:{width:"20px",height:"20px"}}),"Schedule Meeting"]})]})]}),(0,i.jsxs)("div",{className:"timetable-stats",children:[(0,i.jsxs)("div",{className:"stat-item",children:[i.jsx("div",{className:"stat-label",children:"Total Meetings"}),i.jsx("div",{className:"stat-value total",children:u.length})]}),(0,i.jsxs)("div",{className:"stat-item",children:[i.jsx("div",{className:"stat-label",children:"Upcoming"}),i.jsx("div",{className:"stat-value upcoming",children:ef.length})]}),(0,i.jsxs)("div",{className:"stat-item",children:[i.jsx("div",{className:"stat-label",children:"Past Meetings"}),i.jsx("div",{className:"stat-value",children:eh.length})]}),(0,i.jsxs)("div",{className:"stat-item",children:[i.jsx("div",{className:"stat-label",children:"Active Projects"}),i.jsx("div",{className:"stat-value",children:h.length})]})]})]}),(0,i.jsxs)("div",{className:"main-content-area",children:[C&&i.jsx("div",{className:"error-message",children:C}),"calendar"===Z&&(0,i.jsxs)("div",{className:"calendar-navigation",style:{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:"2rem",padding:"1.5rem",border:"2px solid #000000",borderRadius:"8px",background:"#ffffff",boxShadow:"0 2px 8px rgba(0, 0, 0, 0.1)",gap:"1rem"},children:[(0,i.jsxs)("div",{className:"calendar-nav-row-1",style:{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%"},children:[i.jsx("button",{onClick:()=>ej(),className:"nav-button",style:{padding:"0.75rem 1rem",border:"2px solid #000000",background:"#ffffff",borderRadius:"6px",cursor:"pointer",fontSize:"1rem",fontWeight:"600",transition:"all 0.2s ease"},onMouseOver:e=>{e.currentTarget.style.background="#f0f0f0",e.currentTarget.style.transform="translateY(-1px)"},onMouseOut:e=>{e.currentTarget.style.background="#ffffff",e.currentTarget.style.transform="translateY(0)"},children:"← Previous"}),(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"1rem",flex:1,justifyContent:"center"},children:[i.jsx("button",{onClick:()=>{$(new Date)},style:{padding:"0.5rem 1rem",border:"1px solid #6b7280",background:"#ffffff",borderRadius:"6px",cursor:"pointer",fontSize:"0.875rem",fontWeight:"500",color:"#6b7280",transition:"all 0.2s ease"},onMouseOver:e=>{e.currentTarget.style.background="#f9fafb",e.currentTarget.style.borderColor="#374151",e.currentTarget.style.color="#374151"},onMouseOut:e=>{e.currentTarget.style.background="#ffffff",e.currentTarget.style.borderColor="#6b7280",e.currentTarget.style.color="#6b7280"},children:"Today"}),i.jsx("h2",{style:{margin:0,fontSize:"1.5rem",fontWeight:"700",color:"#000000",textAlign:"center"},children:"month"===Y?`${["January","February","March","April","May","June","July","August","September","October","November","December"][U.getMonth()]} ${U.getFullYear()}`:"week"===Y?`Week of ${U.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`:U.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})})]}),i.jsx("button",{onClick:()=>ew(),className:"nav-button",style:{padding:"0.75rem 1rem",border:"2px solid #000000",background:"#ffffff",borderRadius:"6px",cursor:"pointer",fontSize:"1rem",fontWeight:"600",transition:"all 0.2s ease"},onMouseOver:e=>{e.currentTarget.style.background="#f0f0f0",e.currentTarget.style.transform="translateY(-1px)"},onMouseOut:e=>{e.currentTarget.style.background="#ffffff",e.currentTarget.style.transform="translateY(0)"},children:"Next →"})]}),(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"center",gap:"0.5rem"},children:[i.jsx("button",{onClick:()=>O("month"),style:{padding:"0.5rem 1rem",border:"month"===Y?"2px solid #5884FD":"1px solid #d1d5db",background:"month"===Y?"#5884FD":"#ffffff",color:"month"===Y?"#ffffff":"#374151",borderRadius:"6px",cursor:"pointer",fontSize:"0.875rem",fontWeight:"500",transition:"all 0.2s ease"},onMouseOver:e=>{"month"!==Y&&(e.currentTarget.style.background="#f9fafb",e.currentTarget.style.borderColor="#9ca3af")},onMouseOut:e=>{"month"!==Y&&(e.currentTarget.style.background="#ffffff",e.currentTarget.style.borderColor="#d1d5db")},children:"Month"}),i.jsx("button",{onClick:()=>O("week"),style:{padding:"0.5rem 1rem",border:"week"===Y?"2px solid #5884FD":"1px solid #d1d5db",background:"week"===Y?"#5884FD":"#ffffff",color:"week"===Y?"#ffffff":"#374151",borderRadius:"6px",cursor:"pointer",fontSize:"0.875rem",fontWeight:"500",transition:"all 0.2s ease"},onMouseOver:e=>{"week"!==Y&&(e.currentTarget.style.background="#f9fafb",e.currentTarget.style.borderColor="#9ca3af")},onMouseOut:e=>{"week"!==Y&&(e.currentTarget.style.background="#ffffff",e.currentTarget.style.borderColor="#d1d5db")},children:"Week"}),i.jsx("button",{onClick:()=>O("day"),style:{padding:"0.5rem 1rem",border:"day"===Y?"2px solid #5884FD":"1px solid #d1d5db",background:"day"===Y?"#5884FD":"#ffffff",color:"day"===Y?"#ffffff":"#374151",borderRadius:"6px",cursor:"pointer",fontSize:"0.875rem",fontWeight:"500",transition:"all 0.2s ease"},onMouseOver:e=>{"day"!==Y&&(e.currentTarget.style.background="#f9fafb",e.currentTarget.style.borderColor="#9ca3af")},onMouseOut:e=>{"day"!==Y&&(e.currentTarget.style.background="#ffffff",e.currentTarget.style.borderColor="#d1d5db")},children:"Day"})]})]}),"list"===Z&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)("div",{className:"meetings-section",children:[(0,i.jsxs)("h2",{className:"section-title",children:[i.jsx(m.Z,{style:{width:"20px",height:"20px",color:"#10b981"}}),"Upcoming Meetings (",ef.length,")"]}),0===ef.length?(0,i.jsxs)("div",{className:"empty-state",children:[i.jsx("div",{className:"empty-icon",children:i.jsx(d.Z,{style:{width:"32px",height:"32px",color:"#666666"}})}),i.jsx("h3",{style:{fontSize:"1.125rem",fontWeight:"600",color:"#000000",margin:"0 0 0.5rem 0"},children:"No upcoming meetings"}),i.jsx("p",{children:"Schedule your first meeting to get started"})]}):i.jsx("div",{className:"meetings-grid",children:ef.map(e=>(0,i.jsxs)("div",{className:"meeting-card",onClick:()=>ea(e),style:{cursor:"pointer"},children:[(0,i.jsxs)("div",{className:"meeting-header",children:[(0,i.jsxs)("div",{children:[i.jsx("h3",{className:"meeting-title",children:e.title}),i.jsx("p",{className:"meeting-project",children:e.project_name})]}),(0,i.jsxs)("div",{className:"meeting-actions",children:[i.jsx("button",{onClick:t=>{t.stopPropagation(),ed(e)},className:"action-btn",title:"Edit meeting",children:i.jsx(c.Z,{style:{width:"16px",height:"16px"}})}),i.jsx("button",{onClick:t=>{t.stopPropagation(),em(e.id)},className:"action-btn delete",title:"Delete meeting",children:i.jsx(p.Z,{style:{width:"16px",height:"16px"}})})]})]}),(0,i.jsxs)("div",{className:"meeting-details",children:[(0,i.jsxs)("div",{className:"detail-item",children:[i.jsx(m.Z,{style:{width:"16px",height:"16px"}}),i.jsx("span",{children:ec(e.date)})]}),(0,i.jsxs)("div",{className:"detail-item",children:[i.jsx(d.Z,{style:{width:"16px",height:"16px"}}),(0,i.jsxs)("span",{children:[ep(e.time)," (",eg(e.duration),")"]})]}),(0,i.jsxs)("div",{className:"detail-item",children:[i.jsx(g.Z,{style:{width:"16px",height:"16px"}}),(0,i.jsxs)("span",{children:["Organized by ",e.created_by.name]})]})]}),e.description&&i.jsx("p",{className:"meeting-description",children:e.description}),e_(e).length>0&&(0,i.jsxs)("div",{children:[i.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"600",color:"#000000",marginBottom:"0.5rem"},children:"Attendees:"}),i.jsx("div",{className:"attendees-list",children:e_(e).map((e,t)=>i.jsx("span",{className:"attendee-tag",children:e},t))})]})]},e.id))})]}),eh.length>0&&(0,i.jsxs)("div",{className:"meetings-section",children:[(0,i.jsxs)("h2",{className:"section-title",children:[i.jsx(m.Z,{style:{width:"20px",height:"20px",color:"#6b7280"}}),"Past Meetings (",eh.length,")"]}),i.jsx("div",{className:"meetings-grid",children:eh.map(e=>(0,i.jsxs)("div",{className:"meeting-card",onClick:()=>ea(e),style:{opacity:"0.7",cursor:"pointer"},children:[(0,i.jsxs)("div",{className:"meeting-header",children:[(0,i.jsxs)("div",{children:[i.jsx("h3",{className:"meeting-title",children:e.title}),i.jsx("p",{className:"meeting-project",children:e.project_name})]}),i.jsx("div",{className:"meeting-actions",children:i.jsx("button",{onClick:t=>{t.stopPropagation(),em(e.id)},className:"action-btn delete",title:"Delete meeting",children:i.jsx(p.Z,{style:{width:"16px",height:"16px"}})})})]}),(0,i.jsxs)("div",{className:"meeting-details",children:[(0,i.jsxs)("div",{className:"detail-item",children:[i.jsx(m.Z,{style:{width:"16px",height:"16px"}}),i.jsx("span",{children:ec(e.date)})]}),(0,i.jsxs)("div",{className:"detail-item",children:[i.jsx(d.Z,{style:{width:"16px",height:"16px"}}),(0,i.jsxs)("span",{children:[ep(e.time)," (",eg(e.duration),")"]})]}),(0,i.jsxs)("div",{className:"detail-item",children:[i.jsx(g.Z,{style:{width:"16px",height:"16px"}}),(0,i.jsxs)("span",{children:["Organized by ",e.created_by.name]})]})]}),e.description&&i.jsx("p",{className:"meeting-description",children:e.description}),e_(e).length>0&&(0,i.jsxs)("div",{children:[i.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"600",color:"#000000",marginBottom:"0.5rem"},children:"Attendees:"}),i.jsx("div",{className:"attendees-list",children:e_(e).map((e,t)=>i.jsx("span",{className:"attendee-tag",children:e},t))})]})]},e.id))})]})]}),"calendar"===Z&&(0,i.jsxs)(i.Fragment,{children:["month"===Y&&i.jsx("div",{className:"calendar-view",style:{width:J?"calc(100vw - 2rem)":"100%",maxWidth:J?"calc(100vw - 2rem)":"100%",overflow:"hidden",padding:"0",margin:"0 auto",boxSizing:"border-box"},children:(0,i.jsxs)("div",{style:{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:"16px",overflow:"hidden",boxShadow:"0 4px 12px rgba(0, 0, 0, 0.05)"},children:[i.jsx("div",{className:"calendar-header-grid",style:{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",background:"#F9FAFB",borderBottom:"1px solid #E5E7EB",width:"100%",minWidth:"100%"},children:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(e=>i.jsx("div",{style:{padding:"1rem",textAlign:"center",fontWeight:"600",color:"#374151",borderRight:"1px solid #E5E7EB",fontFamily:"'Mabry Pro', 'Inter', sans-serif",fontSize:"0.75rem",letterSpacing:"0.05em",textTransform:"uppercase"},children:e},e))}),(0,i.jsxs)("div",{className:"calendar-body-grid",style:{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",width:"100%",minWidth:"100%",gap:"0"},children:[Array.from({length:eF},(e,t)=>{let r=new Date(U.getFullYear(),U.getMonth()-1),n=ex(r);return i.jsx("div",{className:"calendar-cell other-month",style:{minHeight:"150px",padding:"0.75rem",borderRight:"1px solid #E5E7EB",borderBottom:"1px solid #E5E7EB",background:"#F9FAFB",color:"#9CA3AF"},children:i.jsx("div",{style:{fontWeight:"600",color:"#9CA3AF",marginBottom:"0.5rem",fontFamily:"'Mabry Pro', 'Inter', sans-serif",fontSize:"1rem"},children:n-eF+t+1})},`prev-${t}`)}),Array.from({length:ek},(e,t)=>{let r=t+1,n=new Date(U.getFullYear(),U.getMonth(),r),a=U.getMonth()===eN.getMonth()&&U.getFullYear()===eN.getFullYear()&&r===eN.getDate(),o=eb(n);return(0,i.jsxs)("div",{className:`calendar-cell ${a?"today":""}`,style:{minHeight:"150px",padding:"0.75rem",borderRight:"1px solid #E5E7EB",borderBottom:"1px solid #E5E7EB",background:a?"rgba(88, 132, 253, 0.05)":"#FFFFFF",transition:"all 0.2s ease",cursor:"pointer",...a&&{borderRight:"1px solid #5884FD",borderBottom:"1px solid #5884FD",position:"relative"}},onMouseEnter:e=>{a||(e.currentTarget.style.background="#F9FAFB")},onMouseLeave:e=>{a||(e.currentTarget.style.background="#FFFFFF")},onClick:()=>{let e=n.getFullYear(),t=String(n.getMonth()+1).padStart(2,"0"),r=String(n.getDate()).padStart(2,"0"),i=`${e}-${t}-${r}`;et({...ee,date:i,time:"09:00"}),E(!0)},children:[a&&i.jsx("div",{style:{position:"absolute",top:0,left:0,width:"4px",height:"100%",background:"#5884FD"}}),i.jsx("div",{style:{fontWeight:a?"700":"600",color:a?"#5884FD":"#1F2937",marginBottom:"0.5rem",fontFamily:"'Mabry Pro', 'Inter', sans-serif",fontSize:"1rem"},children:r}),(0,i.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"0.25rem"},children:[(o||[]).slice(0,3).map(e=>(0,i.jsxs)("div",{style:{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:"8px",padding:"0.5rem",fontSize:"0.75rem",marginBottom:"0.25rem",cursor:"pointer",transition:"all 0.2s ease",borderLeft:"3px solid #5884FD"},onClick:t=>{t.stopPropagation(),ea(e)},onMouseEnter:e=>{e.currentTarget.style.background="#F1F5F9",e.currentTarget.style.borderColor="#5884FD",e.currentTarget.style.borderLeftColor="#5884FD"},onMouseLeave:e=>{e.currentTarget.style.background="#F8FAFC",e.currentTarget.style.borderColor="#E2E8F0",e.currentTarget.style.borderLeftColor="#5884FD"},children:[i.jsx("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.25rem"},children:i.jsx("div",{style:{fontWeight:"500",color:"#1F2937",lineHeight:"1.3",flex:1,marginRight:"0.25rem",fontFamily:"'Mabry Pro', 'Inter', sans-serif"},children:e.title})}),(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"0.65rem"},children:[i.jsx("div",{style:{fontWeight:"500",maxWidth:"60%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"#6B7280"},children:ep(e.time)}),(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"0.125rem",color:"#6B7280"},children:[i.jsx(g.Z,{style:{width:"10px",height:"10px"}}),e.created_by.name.split(" ")[0]]})]})]},e.id)),(o||[]).length>3&&(0,i.jsxs)("div",{style:{background:"#EEF2FF",border:"1px solid #C7D2FE",borderRadius:"6px",padding:"0.375rem 0.5rem",fontSize:"0.6875rem",color:"#5B21B6",textAlign:"center",cursor:"pointer",transition:"all 0.2s ease",fontWeight:"500",fontFamily:"'Mabry Pro', 'Inter', sans-serif"},onClick:e=>{e.stopPropagation(),ez(n,o||[])},onMouseEnter:e=>{e.currentTarget.style.background="#E0E7FF",e.currentTarget.style.borderColor="#A5B4FC"},onMouseLeave:e=>{e.currentTarget.style.background="#EEF2FF",e.currentTarget.style.borderColor="#C7D2FE"},children:["+",(o||[]).length-3," more"]})]})]},r)}),Array.from({length:42-(eF+ek)},(e,t)=>i.jsx("div",{className:"calendar-cell other-month",style:{minHeight:"150px",padding:"0.75rem",borderRight:"1px solid #E5E7EB",borderBottom:"1px solid #E5E7EB",background:"#F9FAFB",color:"#9CA3AF"},children:i.jsx("div",{style:{fontWeight:"600",color:"#9CA3AF",marginBottom:"0.5rem",fontFamily:"'Mabry Pro', 'Inter', sans-serif",fontSize:"1rem"},children:t+1})},`next-${t}`))]})]})}),"week"===Y&&i.jsx("div",{className:"calendar-view",style:{width:J?"calc(100vw - 2rem)":"100%",maxWidth:J?"calc(100vw - 2rem)":"100%",overflow:"hidden",padding:"0",margin:"0 auto",boxSizing:"border-box"},children:(0,i.jsxs)("div",{style:{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:"16px",overflow:"hidden",boxShadow:"0 4px 12px rgba(0, 0, 0, 0.05)",minHeight:"600px"},children:[i.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",background:"#F9FAFB",borderBottom:"1px solid #E5E7EB"},children:ey(U).map((e,t)=>i.jsx("div",{style:{padding:"1rem",textAlign:"center",fontWeight:"600",color:"#374151",borderRight:t<6?"1px solid #E5E7EB":"none",fontFamily:"'Mabry Pro', 'Inter', sans-serif",fontSize:"0.875rem"},children:i.jsx("div",{children:ev(e)})},t))}),i.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",minHeight:"500px"},children:ey(U).map((e,t)=>{let r=eb(e),n=e.toDateString()===new Date().toDateString();return(0,i.jsxs)("div",{style:{padding:"1rem",borderRight:t<6?"1px solid #E5E7EB":"none",background:n?"rgba(88, 132, 253, 0.05)":"#FFFFFF",minHeight:"500px",position:"relative"},children:[n&&i.jsx("div",{style:{position:"absolute",top:0,left:0,width:"4px",height:"100%",background:"#5884FD"}}),i.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem"},children:r.map(e=>(0,i.jsxs)("div",{onClick:()=>ea(e),style:{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:"8px",padding:"0.75rem",fontSize:"0.875rem",cursor:"pointer",transition:"all 0.2s ease",borderLeft:"3px solid #5884FD"},onMouseOver:e=>{e.currentTarget.style.background="#F1F5F9",e.currentTarget.style.borderColor="#5884FD"},onMouseOut:e=>{e.currentTarget.style.background="#F8FAFC",e.currentTarget.style.borderColor="#E2E8F0"},children:[i.jsx("div",{style:{fontWeight:"600",color:"#1F2937",marginBottom:"0.25rem"},children:e.title}),i.jsx("div",{style:{fontSize:"0.75rem",color:"#6B7280"},children:ep(e.time)})]},e.id))})]},t)})})]})}),"day"===Y&&i.jsx("div",{className:"calendar-view",style:{width:J?"calc(100vw - 2rem)":"100%",maxWidth:J?"calc(100vw - 2rem)":"100%",overflow:"hidden",padding:"0",margin:"0 auto",boxSizing:"border-box"},children:(0,i.jsxs)("div",{style:{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:"16px",overflow:"hidden",boxShadow:"0 4px 12px rgba(0, 0, 0, 0.05)",minHeight:"700px"},children:[i.jsx("div",{style:{background:"#F9FAFB",borderBottom:"1px solid #E5E7EB",padding:"1.5rem",textAlign:"center"},children:i.jsx("h3",{style:{margin:0,fontSize:"1.25rem",fontWeight:"600",color:"#1F2937",fontFamily:"'Mabry Pro', 'Inter', sans-serif"},children:U.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})})}),i.jsx("div",{style:{padding:"1rem"},children:Array.from({length:24},(e,t)=>{let r=`${t.toString().padStart(2,"0")}:00`,n=eb(U).filter(e=>e.time.startsWith(t.toString().padStart(2,"0")));return(0,i.jsxs)("div",{style:{display:"flex",borderBottom:"1px solid #F3F4F6",minHeight:"60px",alignItems:"flex-start"},children:[i.jsx("div",{style:{width:"80px",padding:"0.5rem",fontSize:"0.875rem",color:"#6B7280",fontWeight:"500",textAlign:"right",borderRight:"1px solid #F3F4F6"},children:r}),i.jsx("div",{style:{flex:1,padding:"0.5rem",display:"flex",flexDirection:"column",gap:"0.25rem"},children:n.map(e=>(0,i.jsxs)("div",{onClick:()=>ea(e),style:{background:"#EEF2FF",border:"1px solid #C7D2FE",borderRadius:"8px",padding:"0.75rem",cursor:"pointer",transition:"all 0.2s ease",borderLeft:"4px solid #5884FD"},onMouseOver:e=>{e.currentTarget.style.background="#E0E7FF",e.currentTarget.style.borderColor="#A5B4FC"},onMouseOut:e=>{e.currentTarget.style.background="#EEF2FF",e.currentTarget.style.borderColor="#C7D2FE"},children:[i.jsx("div",{style:{fontWeight:"600",color:"#1F2937",marginBottom:"0.25rem",fontSize:"1rem"},children:e.title}),(0,i.jsxs)("div",{style:{fontSize:"0.875rem",color:"#6B7280",marginBottom:"0.25rem"},children:[ep(e.time)," • ",e.project_name]}),e.description&&i.jsx("div",{style:{fontSize:"0.75rem",color:"#9CA3AF"},children:e.description})]},e.id))})]},t)})})]})})]})]})]}),L&&A&&i.jsx(k,{meeting:A,onClose:()=>{P(!1),B(null)},onUpdate:eo,onDelete:es,projectMembers:j,projects:h,onProjectChange:e=>{ei(e)}}),H&&X&&i.jsx("div",{className:"modal-overlay",onClick:()=>{q(!1),Q(null),V([])},children:(0,i.jsxs)("div",{className:"modal-content",onClick:e=>e.stopPropagation(),children:[(0,i.jsxs)("div",{className:"modal-header",children:[(0,i.jsxs)("h2",{className:"modal-title",children:["Meetings for ",X.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})]}),i.jsx("button",{type:"button",onClick:()=>{q(!1),Q(null),V([])},className:"modal-close-btn",children:"\xd7"})]}),i.jsx("div",{className:"modal-body",style:{maxHeight:"400px",overflowY:"auto"},children:0===G.length?i.jsx("p",{style:{textAlign:"center",color:"#666666",padding:"2rem"},children:"No meetings scheduled for this day"}):i.jsx("div",{className:"meetings-list",style:{display:"flex",flexDirection:"column",gap:"0.75rem"},children:G.map(e=>(0,i.jsxs)("div",{className:"meeting-item",style:{padding:"1rem",border:"2px solid #e0e0e0",borderRadius:"8px",background:"#ffffff",cursor:"pointer",transition:"all 0.2s ease"},onClick:()=>{q(!1),Q(null),V([]),ea(e)},onMouseOver:e=>{e.currentTarget.style.background="#f5f5f5",e.currentTarget.style.borderColor="#000000"},onMouseOut:e=>{e.currentTarget.style.background="#ffffff",e.currentTarget.style.borderColor="#e0e0e0"},children:[(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"},children:[(0,i.jsxs)("div",{children:[i.jsx("h4",{style:{margin:0,fontSize:"1rem",fontWeight:"600",color:"#000000"},children:e.title}),i.jsx("p",{style:{margin:"0.25rem 0 0 0",fontSize:"0.875rem",color:"#666666"},children:e.project_name})]}),(0,i.jsxs)("div",{style:{display:"flex",gap:"0.5rem"},children:[i.jsx("button",{onClick:t=>{t.stopPropagation(),q(!1),Q(null),V([]),ed(e)},style:{padding:"0.25rem",border:"1px solid #e0e0e0",background:"#ffffff",borderRadius:"4px",cursor:"pointer",fontSize:"0.75rem"},title:"Edit meeting",children:"✏️"}),i.jsx("button",{onClick:t=>{t.stopPropagation(),em(e.id),V(G.filter(t=>t.id!==e.id))},style:{padding:"0.25rem",border:"1px solid #e0e0e0",background:"#ffffff",borderRadius:"4px",cursor:"pointer",fontSize:"0.75rem"},title:"Delete meeting",children:"\uD83D\uDDD1️"})]})]}),(0,i.jsxs)("div",{style:{display:"flex",gap:"1rem",fontSize:"0.875rem",color:"#666666"},children:[(0,i.jsxs)("span",{children:["\uD83D\uDD50 ",ep(e.time)]}),(0,i.jsxs)("span",{children:["⏱️ ",eg(e.duration)]}),(0,i.jsxs)("span",{children:["\uD83D\uDC64 ",e.created_by.name]})]}),e.description&&i.jsx("p",{style:{margin:"0.5rem 0 0 0",fontSize:"0.875rem",color:"#333333",lineHeight:"1.4"},children:e.description}),e_(e).length>0&&(0,i.jsxs)("div",{style:{marginTop:"0.5rem"},children:[i.jsx("span",{style:{fontSize:"0.75rem",fontWeight:"600",color:"#666666"},children:"Attendees:"}),i.jsx("span",{style:{fontSize:"0.75rem",color:"#333333"},children:e_(e).join(", ")})]})]},e.id))})})]})}),D&&i.jsx("div",{className:"modal-overlay",onClick:()=>{E(!1),T(null),et({title:"",description:"",date:"",time:"",duration:60,project_id:0,attendees:"",attendee_ids:[]})},children:(0,i.jsxs)("div",{className:"modal-content",onClick:e=>e.stopPropagation(),children:[(0,i.jsxs)("div",{className:"modal-header",children:[i.jsx("h2",{className:"modal-title",children:M?"Edit Meeting":"Schedule New Meeting"}),i.jsx("button",{type:"button",onClick:()=>{E(!1),T(null),et({title:"",description:"",date:"",time:"",duration:60,project_id:0,attendees:"",attendee_ids:[]})},className:"modal-close-btn",children:"\xd7"})]}),(0,i.jsxs)("form",{onSubmit:M?el:en,className:"modal-form",children:[(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Meeting Title *"}),i.jsx("input",{type:"text",required:!0,className:"form-input",placeholder:"Enter meeting title...",value:ee.title,onChange:e=>et({...ee,title:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Description"}),i.jsx("textarea",{className:"form-textarea",placeholder:"What will be discussed in this meeting?",value:ee.description,onChange:e=>et({...ee,description:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Project *"}),(0,i.jsxs)("select",{required:!0,className:"form-select",value:ee.project_id,onChange:e=>et({...ee,project_id:Number(e.target.value)}),children:[i.jsx("option",{value:0,children:"Select a project"}),h.map(e=>i.jsx("option",{value:e.id,children:e.name},e.id))]})]}),(0,i.jsxs)("div",{className:"form-grid-3",children:[(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Date *"}),i.jsx("input",{type:"date",required:!0,className:"form-input",value:ee.date,onChange:e=>et({...ee,date:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Time *"}),i.jsx("input",{type:"time",required:!0,className:"form-input",value:ee.time,onChange:e=>et({...ee,time:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Duration"}),i.jsx("input",{type:"number",min:"15",max:"480",step:"15",className:"form-input",placeholder:"Minutes",value:ee.duration,onChange:e=>et({...ee,duration:Number(e.target.value)})})]})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Invite Attendees (Optional)"}),ee.attendee_ids.length>0&&i.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.5rem",marginBottom:"0.75rem",padding:"0.75rem",backgroundColor:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"6px"},children:ee.attendee_ids.map(e=>{let t=j.find(t=>t.id===e);return t?(0,i.jsxs)("span",{style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.25rem 0.75rem",backgroundColor:"#000000",color:"#ffffff",borderRadius:"20px",fontSize:"0.875rem"},children:[t.name,i.jsx("button",{type:"button",onClick:()=>et(t=>({...t,attendee_ids:t.attendee_ids.filter(t=>t!==e)})),style:{background:"none",border:"none",color:"#ffffff",cursor:"pointer",fontSize:"1rem",lineHeight:"1"},children:"\xd7"})]},e):null})}),j.length>0?i.jsx("div",{style:{border:"2px solid #e5e7eb",borderRadius:"6px",maxHeight:"200px",overflowY:"auto"},children:j.map(e=>{let t=ee.attendee_ids.includes(e.id);return(0,i.jsxs)("div",{onClick:()=>{et(r=>({...r,attendee_ids:t?r.attendee_ids.filter(t=>t!==e.id):[...r.attendee_ids,e.id]}))},style:{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",borderBottom:"1px solid #e5e7eb",cursor:"pointer",backgroundColor:t?"#f0f9ff":"#ffffff",borderLeft:t?"4px solid #000000":"4px solid transparent"},children:[i.jsx("input",{type:"checkbox",checked:t,onChange:()=>{},style:{cursor:"pointer"}}),(0,i.jsxs)("div",{style:{flex:1},children:[i.jsx("div",{style:{fontWeight:"500",color:"#000000"},children:e.name}),i.jsx("div",{style:{fontSize:"0.875rem",color:"#6b7280"},children:e.email})]})]},e.id)})}):i.jsx("div",{style:{padding:"2rem",textAlign:"center",color:"#6b7280",border:"2px dashed #e5e7eb",borderRadius:"6px"},children:"Select a project first to see available members"})]}),(0,i.jsxs)("div",{className:"form-actions",children:[i.jsx("button",{type:"submit",className:"btn-primary",children:M?"Update Meeting":"Schedule Meeting"}),i.jsx("button",{type:"button",onClick:()=>{E(!1),T(null),et({title:"",description:"",date:"",time:"",duration:60,project_id:0,attendees:"",attendee_ids:[]})},className:"btn-secondary",children:"Cancel"})]})]})]})})]}):null}},3344:(e,t,r)=>{"use strict";r.r(t),r.d(t,{$$typeof:()=>o,__esModule:()=>a,default:()=>d});var i=r(5153);let n=(0,i.createProxy)(String.raw`/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/timetable/page.tsx`),{__esModule:a,$$typeof:o}=n,s=n.default,d=s},3881:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>n});var i=r(8531);let n=e=>{let t=(0,i.fillMetadataSegment)(".",e.params,"favicon.ico");return[{type:"image/x-icon",sizes:"16x16",url:t+""}]}},4448:(e,t,r)=>{"use strict";r.d(t,{Z:()=>a});var i=r(4218);let n=i.forwardRef(function({title:e,titleId:t,...r},n){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:n,"aria-labelledby":t},r),e?i.createElement("title",{id:t},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m4.5 12.75 6 6 9-13.5"}))}),a=n},2244:(e,t,r)=>{"use strict";r.d(t,{Z:()=>a});var i=r(4218);let n=i.forwardRef(function({title:e,titleId:t,...r},n){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:n,"aria-labelledby":t},r),e?i.createElement("title",{id:t},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"}))}),a=n},1685:(e,t,r)=>{"use strict";r.d(t,{Z:()=>a});var i=r(4218);let n=i.forwardRef(function({title:e,titleId:t,...r},n){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:n,"aria-labelledby":t},r),e?i.createElement("title",{id:t},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"}))}),a=n},856:(e,t,r)=>{"use strict";r.d(t,{Z:()=>a});var i=r(4218);let n=i.forwardRef(function({title:e,titleId:t,...r},n){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:n,"aria-labelledby":t},r),e?i.createElement("title",{id:t},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"}))}),a=n},2769:(e,t,r)=>{"use strict";r.d(t,{Z:()=>a});var i=r(4218);let n=i.forwardRef(function({title:e,titleId:t,...r},n){return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:n,"aria-labelledby":t},r),e?i.createElement("title",{id:t},e):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"}))}),a=n}};var t=require("../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),i=t.X(0,[3271,3913,1323,1336,4937],()=>r(914));module.exports=i})();