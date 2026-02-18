"use strict";exports.id=1111,exports.ids=[1111],exports.modules={71111:(e,t,s)=>{s.d(t,{Z:()=>k});var i=s(53854),n=s(34218),o=s(32399),r=s(70856),a=s(71888),l=s(74448),d=s(96835),c=s(89618),m=s(54791),p=s(82244),h=s(61685),x=s(2769),g=s(26965),u=s(34148),b=s(18998),f=s(97530),j=s(95880),y=s(8041),N=s(67689),v=s(20199);class _{async getMeetingNotes(e){try{let t=(await Promise.resolve().then(s.bind(s,2132))).supabase,{data:i,error:n}=await t.from("meeting_notes").select("*").eq("meeting_id",e).single();if(n)return console.error("Error fetching meeting notes:",n),null;return i}catch(e){return console.error("Error in getMeetingNotes:",e),null}}async createMeetingNotes(e){try{let t=(await Promise.resolve().then(s.bind(s,2132))).supabase,{data:i,error:n}=await t.from("meeting_notes").insert([e]).select().single();if(n)throw Error(`Failed to create meeting notes: ${n.message}`);return i}catch(e){throw console.error("Error in createMeetingNotes:",e),e}}async updateMeetingNotes(e,t){try{let i=(await Promise.resolve().then(s.bind(s,2132))).supabase,{data:n,error:o}=await i.from("meeting_notes").update({...t,updated_at:new Date().toISOString()}).eq("id",e).select().single();if(o)throw Error(`Failed to update meeting notes: ${o.message}`);return n}catch(e){throw console.error("Error in updateMeetingNotes:",e),e}}async deleteMeetingNotes(e){try{let t=(await Promise.resolve().then(s.bind(s,2132))).supabase,{error:i}=await t.from("meeting_notes").delete().eq("id",e);if(i)throw Error(`Failed to delete meeting notes: ${i.message}`)}catch(e){throw console.error("Error in deleteMeetingNotes:",e),e}}}let w=new _;function F({meeting:e,onClose:t,projectMembers:s=[]}){let[o,r]=(0,n.useState)({meeting_id:e.id,title:e.title,date:e.date,time:e.time,attendees:e.attendees_list||[],discussion_points:[""],decisions_made:[""],action_items:[""],next_steps:[""],discussion_sections:[],decision_sections:[],action_sections:[],next_step_sections:[],follow_up_date:""}),[l,c]=(0,n.useState)(null),[m,_]=(0,n.useState)(!0),[F,D]=(0,n.useState)(!1),[k,C]=(0,n.useState)(""),[A,S]=(0,n.useState)(null),[z,E]=(0,n.useState)(!1),[Z,M]=(0,n.useState)({}),[I,T]=(0,n.useState)({}),[R,B]=(0,n.useState)({});(0,n.useEffect)(()=>{let t=async()=>{try{let t=await w.getMeetingNotes(e.id);t?(c(t),r({...t,discussion_points:t.discussion_points.length>0?t.discussion_points:[""],decisions_made:t.decisions_made.length>0?t.decisions_made:[""],action_items:t.action_items.length>0?t.action_items:[""],next_steps:t.next_steps.length>0?t.next_steps:[""],discussion_sections:t.discussion_sections||[],decision_sections:t.decision_sections||[],action_sections:t.action_sections||[],next_step_sections:t.next_step_sections||[]}),E(!1)):E(!0)}catch(e){console.error("Failed to load meeting notes:",e),E(!0)}finally{_(!1)}};t()},[e.id]);let P=(e,t)=>{r(s=>{let i=s[e];if(void 0===t)return{...s,[e]:[...i,""]};{let n=[...i];return n.splice(t+1,0,""),{...s,[e]:n}}})},$=(e,t,s)=>{r(i=>{let n=i[e],o=[...n];return o[t]=s,{...i,[e]:o}})},L=(e,t)=>{r(s=>{let i=s[e];if(i.length>1){let n=i.filter((e,s)=>s!==t);return{...s,[e]:n}}return s})},K=()=>{k.trim()&&(r(e=>({...e,attendees:[...e.attendees,k.trim()]})),C(""))},U=e=>{r(t=>({...t,attendees:t.attendees.filter((t,s)=>s!==e)}))},Y=e=>{o.attendees.includes(e.name)||r(t=>({...t,attendees:[...t.attendees,e.name]}))},W=()=>`section-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,H=(e,t)=>{if(!t.trim())return;let s={id:W(),name:t.trim(),notes:[""]};r(t=>({...t,[e]:[...t[e]||[],s]})),M(t=>({...t,[e]:""})),B(t=>({...t,[e]:!1})),T(e=>({...e,[s.id]:!0}))},q=(e,t)=>{r(s=>({...s,[e]:(s[e]||[]).filter(e=>e.id!==t)}))},G=(e,t,s)=>{r(i=>({...i,[e]:(i[e]||[]).map(e=>{if(e.id===t){let t=[...e.notes];return void 0!==s?t.splice(s+1,0,""):t.push(""),{...e,notes:t}}return e})}))},J=(e,t,s,i)=>{r(n=>({...n,[e]:(n[e]||[]).map(e=>{if(e.id===t){let t=[...e.notes];return t[s]=i,{...e,notes:t}}return e})}))},V=(e,t,s)=>{r(i=>({...i,[e]:(i[e]||[]).map(e=>e.id===t&&e.notes.length>1?{...e,notes:e.notes.filter((e,t)=>t!==s)}:e)}))},O=e=>{T(t=>({...t,[e]:!t[e]}))},X=async()=>{D(!0);try{let e;let t=e=>e?e.map(e=>({...e,notes:e.notes.filter(e=>e.trim())})).filter(e=>e.notes.length>0):[],s={...o,discussion_points:o.discussion_points.filter(e=>e.trim()),decisions_made:o.decisions_made.filter(e=>e.trim()),action_items:o.action_items.filter(e=>e.trim()),next_steps:o.next_steps.filter(e=>e.trim()),discussion_sections:t(o.discussion_sections),decision_sections:t(o.decision_sections),action_sections:t(o.action_sections),next_step_sections:t(o.next_step_sections),follow_up_date:o.follow_up_date?.trim()||null};e=l?.id?await w.updateMeetingNotes(l.id,s):await w.createMeetingNotes(s),c(e),r(e),E(!1),alert("Meeting notes saved successfully!")}catch(e){console.error("Failed to save meeting notes:",e),alert("Failed to save meeting notes")}finally{D(!1)}},Q=()=>{E(!0)},ee=e=>{S(e)};return m?(0,i.jsxs)("div",{className:"modal-overlay",onClick:t,children:[i.jsx("div",{className:"notes-modal",onClick:e=>e.stopPropagation(),children:(0,i.jsxs)("div",{className:"loading-container",children:[i.jsx("div",{className:"loading-spinner"}),i.jsx("p",{children:"Loading meeting notes..."})]})}),i.jsx("style",{dangerouslySetInnerHTML:{__html:`
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
              background: #1A1A1A;
              border: 3px solid #2D2D2D;
              border-radius: 16px;
              width: 100%;
              max-width: 900px;
              max-height: 90vh;
              overflow-y: auto;
            }
            .loading-container {
              text-align: center;
              padding: 3rem;
              color: #71717A;
            }
            .loading-spinner {
              width: 40px;
              height: 40px;
              border: 3px solid #3D3D3D;
              border-top: 3px solid #FFFFFF;
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
            background: #1A1A1A;
            border: 3px solid #2D2D2D;
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
            border-bottom: 3px solid #2D2D2D;
            background: linear-gradient(135deg, #141414 0%, #2D2D2D 100%);
            position: relative;
          }
          .notes-title {
            font-size: 2rem;
            font-weight: 800;
            color: #FFFFFF;
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
            border: 2px solid #FFFFFF;
            border-radius: 50%;
            background: #FFFFFF;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #1A1A1A;
            box-shadow: 0 2px 8px rgba(255,255,255,0.2);
          }
          .close-btn:hover {
            background: #1F1F1F;
            color: #EF4444;
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 4px 12px rgba(255,255,255,0.3);
          }
          .notes-content {
            padding: 2rem;
          }
          .form-section {
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: #141414;
            border: 2px solid #2D2D2D;
            border-radius: 12px;
          }
          .section-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #FFFFFF;
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
            color: #FFFFFF;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
          }
          .form-input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #3D3D3D;
            border-radius: 8px;
            font-size: 0.875rem;
            transition: all 0.2s ease;
            box-sizing: border-box;
            background: #1A1A1A;
            color: #FFFFFF;
          }
          .form-input:focus {
            outline: none;
            border-color: #3B82F6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          }
          .attendees-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1rem;
            min-height: 2rem;
            padding: 0.75rem;
            border: 2px dashed #3D3D3D;
            border-radius: 8px;
            background: #1A1A1A;
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
            background: #2D2D2D;
            border: 1px solid #3D3D3D;
            border-radius: 6px;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
            color: #E4E4E7;
          }
          .member-btn:hover {
            background: #3D3D3D;
            border-color: #71717A;
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
            border: 2px solid #3D3D3D;
            border-radius: 8px;
            font-size: 0.875rem;
            min-height: 80px;
            resize: vertical;
            transition: all 0.2s ease;
            position: relative;
            box-sizing: border-box;
            background: #1A1A1A;
            color: #FFFFFF;
          }
          .discussion-input:focus {
            outline: none;
            border-color: #3B82F6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          }
          .discussion-input.active {
            border-color: #3B82F6;
            background: #141414;
          }
          .discussion-controls {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .control-btn {
            padding: 0.5rem;
            border: 1px solid #3D3D3D;
            border-radius: 6px;
            background: #141414;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #E4E4E7;
          }
          .control-btn:hover {
            border-color: #FFFFFF;
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
            background: #2D2D2D;
            padding: 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            color: #71717A;
            margin-bottom: 0.5rem;
            font-style: italic;
          }
          .save-section {
            padding: 2rem;
            border-top: 3px solid #2D2D2D;
            background: #141414;
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
            background: #71717A;
            cursor: not-allowed;
            transform: none;
          }
          .cancel-btn {
            padding: 1rem 2rem;
            background: #141414;
            color: #FFFFFF;
            border: 2px solid #3D3D3D;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .cancel-btn:hover {
            border-color: #FFFFFF;
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
            background: #1A1A1A;
            padding: 2rem;
            line-height: 1.6;
            color: #E4E4E7;
          }
          .document-header {
            border-bottom: 2px solid #2D2D2D;
            padding-bottom: 1.5rem;
            margin-bottom: 2rem;
          }
          .document-title {
            font-size: 2rem;
            font-weight: 800;
            color: #FFFFFF;
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
            background: #141414;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            font-size: 0.875rem;
            border: 1px solid #2D2D2D;
          }
          .document-section {
            margin-bottom: 2rem;
          }
          .section-heading {
            font-size: 1.25rem;
            font-weight: 700;
            color: #FFFFFF;
            margin: 0 0 1rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #2D2D2D;
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
            color: #FFFFFF;
            font-weight: 700;
            font-size: 1.25rem;
            flex-shrink: 0;
          }
          .document-footer {
            border-top: 2px solid #2D2D2D;
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
          /* Sub-section Styles for Document View */
          .sub-section {
            margin-top: 1rem;
            padding: 1rem;
            background: #141414;
            border: 1px solid #2D2D2D;
            border-radius: 8px;
            margin-left: 1rem;
          }
          .sub-section-heading {
            font-size: 1rem;
            font-weight: 600;
            color: #E4E4E7;
            margin: 0 0 0.75rem 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #2D2D2D;
          }
          .sub-list {
            margin-left: 0.5rem;
          }
          /* Section Management Styles for Edit View */
          .add-section-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: #2D2D2D;
            border: 1px solid #3D3D3D;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 600;
            color: #E4E4E7;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .add-section-btn:hover {
            background: #3D3D3D;
            border-color: #71717A;
          }
          .add-section-input {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
            padding: 1rem;
            background: rgba(251, 191, 36, 0.1);
            border: 1px solid rgba(251, 191, 36, 0.3);
            border-radius: 8px;
          }
          .add-section-input .form-input {
            flex: 1;
          }
          .cancel-section-btn {
            padding: 0.75rem 1rem;
            background: #141414;
            color: #71717A;
            border: 1px solid #3D3D3D;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
          }
          .cancel-section-btn:hover {
            background: #2D2D2D;
            border-color: #71717A;
          }
          .general-notes-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #71717A;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.75rem;
            padding-left: 0.5rem;
          }
          .section-container {
            margin-top: 1rem;
            border: 2px solid #2D2D2D;
            border-radius: 8px;
            overflow: hidden;
            background: #1A1A1A;
          }
          .section-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            background: linear-gradient(135deg, #2D2D2D 0%, #3D3D3D 100%);
            cursor: pointer;
            transition: all 0.2s ease;
            border-bottom: 1px solid #2D2D2D;
          }
          .section-header:hover {
            background: linear-gradient(135deg, #3D3D3D 0%, #4D4D4D 100%);
          }
          .section-name {
            font-weight: 700;
            color: #FFFFFF;
            flex: 1;
          }
          .section-count {
            font-size: 0.75rem;
            color: #71717A;
            font-weight: 500;
          }
          .remove-section-btn {
            padding: 0.375rem;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 4px;
            color: #dc2626;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .remove-section-btn:hover {
            background: #fee2e2;
            border-color: #f87171;
          }
          .section-notes {
            padding: 1rem;
            background: #141414;
          }
          .section-note-item {
            margin-bottom: 0.75rem;
          }
          .section-number {
            background: #71717A !important;
            font-size: 0.625rem !important;
            width: 1.5rem !important;
            height: 1.5rem !important;
          }
          .section-input {
            min-height: 60px !important;
          }
        `}}),(0,i.jsxs)("div",{className:"notes-modal",onClick:e=>e.stopPropagation(),children:[(0,i.jsxs)("div",{className:"notes-header",children:[(0,i.jsxs)("h1",{className:"notes-title",children:[i.jsx(p.Z,{style:{width:"2rem",height:"2rem"}}),"Meeting Notes"]}),i.jsx("button",{onClick:t,className:"close-btn",children:i.jsx(d.Z,{style:{width:"1.5rem",height:"1.5rem"}})})]}),i.jsx("div",{className:"notes-content",children:z?(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("h2",{className:"section-title",children:[i.jsx(g.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Meeting Information"]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Meeting Title"}),i.jsx("input",{type:"text",className:"form-input",value:o.title,onChange:e=>r({...o,title:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-row-three",children:[(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Date"}),i.jsx("input",{type:"date",className:"form-input",value:o.date,onChange:e=>r({...o,date:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Time"}),i.jsx("input",{type:"time",className:"form-input",value:o.time,onChange:e=>r({...o,time:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Follow-up Date"}),i.jsx("input",{type:"date",className:"form-input",value:o.follow_up_date||"",onChange:e=>r({...o,follow_up_date:e.target.value})})]})]})]}),(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("h2",{className:"section-title",children:[i.jsx(x.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Attendees"]}),i.jsx("div",{className:"attendees-container",children:o.attendees.map((e,t)=>(0,i.jsxs)("div",{className:"attendee-tag",children:[e,i.jsx("span",{onClick:()=>U(t),className:"attendee-remove",children:"\xd7"})]},t))}),(0,i.jsxs)("div",{className:"attendee-input-row",children:[i.jsx("input",{type:"text",className:"form-input",placeholder:"Add attendee...",value:k,onChange:e=>C(e.target.value),onKeyPress:e=>"Enter"===e.key&&K()}),(0,i.jsxs)("button",{onClick:K,className:"add-btn",children:[i.jsx(b.Z,{style:{width:"1rem",height:"1rem"}}),"Add"]})]}),s.length>0&&(0,i.jsxs)("div",{className:"project-members",children:[i.jsx("span",{style:{fontSize:"0.75rem",color:"#71717A",marginRight:"0.5rem"},children:"Quick add:"}),s.map((e,t)=>i.jsx("button",{onClick:()=>Y(e),className:"member-btn",children:e.name},t))]})]}),(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"},children:[(0,i.jsxs)("h2",{className:"section-title",style:{marginBottom:0},children:[i.jsx(h.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Key Discussion Points"]}),(0,i.jsxs)("button",{onClick:()=>B(e=>({...e,discussion_sections:!e.discussion_sections})),className:"add-section-btn",title:"Add a new section",children:[i.jsx(f.Z,{style:{width:"1rem",height:"1rem"}}),"Add Section"]})]}),R.discussion_sections&&(0,i.jsxs)("div",{className:"add-section-input",children:[i.jsx("input",{type:"text",className:"form-input",placeholder:"Enter section name (e.g., Raminder, John)",value:Z.discussion_sections||"",onChange:e=>M(t=>({...t,discussion_sections:e.target.value})),onKeyPress:e=>"Enter"===e.key&&H("discussion_sections",Z.discussion_sections||"")}),i.jsx("button",{onClick:()=>H("discussion_sections",Z.discussion_sections||""),className:"add-btn",children:"Create"}),i.jsx("button",{onClick:()=>B(e=>({...e,discussion_sections:!1})),className:"cancel-section-btn",children:"Cancel"})]}),i.jsx("div",{className:"general-notes-label",children:"General Notes"}),o.discussion_points.map((e,t)=>(0,i.jsxs)("div",{children:[A===t&&t>0&&(0,i.jsxs)("div",{className:"previous-line",children:["Previous: ",o.discussion_points[t-1]||"No previous discussion point"]}),(0,i.jsxs)("div",{className:"discussion-item",children:[i.jsx("div",{className:"discussion-number",children:t+1}),i.jsx("textarea",{className:`discussion-input ${A===t?"active":""}`,placeholder:"Enter discussion point...",value:e,onChange:e=>$("discussion_points",t,e.target.value),onFocus:()=>ee(t)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>P("discussion_points",t),className:"control-btn add",title:"Add discussion point after this one",children:i.jsx(b.Z,{style:{width:"1rem",height:"1rem"}})}),o.discussion_points.length>1&&i.jsx("button",{onClick:()=>L("discussion_points",t),className:"control-btn",title:"Remove this discussion point",children:i.jsx(a.Z,{style:{width:"1rem",height:"1rem"}})}),t>0&&i.jsx("button",{onClick:()=>S(A===t?null:t),className:"control-btn",title:"Show previous line",children:i.jsx(j.Z,{style:{width:"1rem",height:"1rem"}})})]})]})]},t)),o.discussion_sections&&o.discussion_sections.map(e=>(0,i.jsxs)("div",{className:"section-container",children:[(0,i.jsxs)("div",{className:"section-header",onClick:()=>O(e.id),children:[I[e.id]?i.jsx(y.Z,{style:{width:"1rem",height:"1rem"}}):i.jsx(N.Z,{style:{width:"1rem",height:"1rem"}}),i.jsx(u.Z,{style:{width:"1.25rem",height:"1.25rem"}}),i.jsx("span",{className:"section-name",children:e.name}),(0,i.jsxs)("span",{className:"section-count",children:["(",e.notes.filter(e=>e.trim()).length," notes)"]}),i.jsx("button",{onClick:t=>{t.stopPropagation(),q("discussion_sections",e.id)},className:"remove-section-btn",title:"Remove section",children:i.jsx(a.Z,{style:{width:"0.875rem",height:"0.875rem"}})})]}),I[e.id]&&i.jsx("div",{className:"section-notes",children:e.notes.map((t,s)=>(0,i.jsxs)("div",{className:"discussion-item section-note-item",children:[i.jsx("div",{className:"discussion-number section-number",children:s+1}),i.jsx("textarea",{className:"discussion-input section-input",placeholder:`Enter ${e.name}'s note...`,value:t,onChange:t=>J("discussion_sections",e.id,s,t.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>G("discussion_sections",e.id,s),className:"control-btn add",title:"Add note after this one",children:i.jsx(b.Z,{style:{width:"1rem",height:"1rem"}})}),e.notes.length>1&&i.jsx("button",{onClick:()=>V("discussion_sections",e.id,s),className:"control-btn",title:"Remove note",children:i.jsx(a.Z,{style:{width:"1rem",height:"1rem"}})})]})]},s))})]},e.id))]}),(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"},children:[(0,i.jsxs)("h2",{className:"section-title",style:{marginBottom:0},children:[i.jsx(v.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Decisions Made"]}),(0,i.jsxs)("button",{onClick:()=>B(e=>({...e,decision_sections:!e.decision_sections})),className:"add-section-btn",title:"Add a new section",children:[i.jsx(f.Z,{style:{width:"1rem",height:"1rem"}}),"Add Section"]})]}),R.decision_sections&&(0,i.jsxs)("div",{className:"add-section-input",children:[i.jsx("input",{type:"text",className:"form-input",placeholder:"Enter section name (e.g., Raminder, John)",value:Z.decision_sections||"",onChange:e=>M(t=>({...t,decision_sections:e.target.value})),onKeyPress:e=>"Enter"===e.key&&H("decision_sections",Z.decision_sections||"")}),i.jsx("button",{onClick:()=>H("decision_sections",Z.decision_sections||""),className:"add-btn",children:"Create"}),i.jsx("button",{onClick:()=>B(e=>({...e,decision_sections:!1})),className:"cancel-section-btn",children:"Cancel"})]}),i.jsx("div",{className:"general-notes-label",children:"General Notes"}),o.decisions_made.map((e,t)=>(0,i.jsxs)("div",{className:"discussion-item",children:[(0,i.jsxs)("div",{className:"discussion-number",children:["D",t+1]}),i.jsx("textarea",{className:"discussion-input",placeholder:"Enter decision made...",value:e,onChange:e=>$("decisions_made",t,e.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>P("decisions_made",t),className:"control-btn add",children:i.jsx(b.Z,{style:{width:"1rem",height:"1rem"}})}),o.decisions_made.length>1&&i.jsx("button",{onClick:()=>L("decisions_made",t),className:"control-btn",children:i.jsx(a.Z,{style:{width:"1rem",height:"1rem"}})})]})]},t)),o.decision_sections&&o.decision_sections.map(e=>(0,i.jsxs)("div",{className:"section-container",children:[(0,i.jsxs)("div",{className:"section-header",onClick:()=>O(e.id),children:[I[e.id]?i.jsx(y.Z,{style:{width:"1rem",height:"1rem"}}):i.jsx(N.Z,{style:{width:"1rem",height:"1rem"}}),i.jsx(u.Z,{style:{width:"1.25rem",height:"1.25rem"}}),i.jsx("span",{className:"section-name",children:e.name}),(0,i.jsxs)("span",{className:"section-count",children:["(",e.notes.filter(e=>e.trim()).length," notes)"]}),i.jsx("button",{onClick:t=>{t.stopPropagation(),q("decision_sections",e.id)},className:"remove-section-btn",title:"Remove section",children:i.jsx(a.Z,{style:{width:"0.875rem",height:"0.875rem"}})})]}),I[e.id]&&i.jsx("div",{className:"section-notes",children:e.notes.map((t,s)=>(0,i.jsxs)("div",{className:"discussion-item section-note-item",children:[(0,i.jsxs)("div",{className:"discussion-number section-number",children:["D",s+1]}),i.jsx("textarea",{className:"discussion-input section-input",placeholder:`Enter ${e.name}'s decision...`,value:t,onChange:t=>J("decision_sections",e.id,s,t.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>G("decision_sections",e.id,s),className:"control-btn add",children:i.jsx(b.Z,{style:{width:"1rem",height:"1rem"}})}),e.notes.length>1&&i.jsx("button",{onClick:()=>V("decision_sections",e.id,s),className:"control-btn",children:i.jsx(a.Z,{style:{width:"1rem",height:"1rem"}})})]})]},s))})]},e.id))]}),(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"},children:[(0,i.jsxs)("h2",{className:"section-title",style:{marginBottom:0},children:[i.jsx(p.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Action Items"]}),(0,i.jsxs)("button",{onClick:()=>B(e=>({...e,action_sections:!e.action_sections})),className:"add-section-btn",title:"Add a new section",children:[i.jsx(f.Z,{style:{width:"1rem",height:"1rem"}}),"Add Section"]})]}),R.action_sections&&(0,i.jsxs)("div",{className:"add-section-input",children:[i.jsx("input",{type:"text",className:"form-input",placeholder:"Enter section name (e.g., Raminder, John)",value:Z.action_sections||"",onChange:e=>M(t=>({...t,action_sections:e.target.value})),onKeyPress:e=>"Enter"===e.key&&H("action_sections",Z.action_sections||"")}),i.jsx("button",{onClick:()=>H("action_sections",Z.action_sections||""),className:"add-btn",children:"Create"}),i.jsx("button",{onClick:()=>B(e=>({...e,action_sections:!1})),className:"cancel-section-btn",children:"Cancel"})]}),i.jsx("div",{className:"general-notes-label",children:"General Notes"}),o.action_items.map((e,t)=>(0,i.jsxs)("div",{className:"discussion-item",children:[(0,i.jsxs)("div",{className:"discussion-number",children:["A",t+1]}),i.jsx("textarea",{className:"discussion-input",placeholder:"Enter action item...",value:e,onChange:e=>$("action_items",t,e.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>P("action_items",t),className:"control-btn add",children:i.jsx(b.Z,{style:{width:"1rem",height:"1rem"}})}),o.action_items.length>1&&i.jsx("button",{onClick:()=>L("action_items",t),className:"control-btn",children:i.jsx(a.Z,{style:{width:"1rem",height:"1rem"}})})]})]},t)),o.action_sections&&o.action_sections.map(e=>(0,i.jsxs)("div",{className:"section-container",children:[(0,i.jsxs)("div",{className:"section-header",onClick:()=>O(e.id),children:[I[e.id]?i.jsx(y.Z,{style:{width:"1rem",height:"1rem"}}):i.jsx(N.Z,{style:{width:"1rem",height:"1rem"}}),i.jsx(u.Z,{style:{width:"1.25rem",height:"1.25rem"}}),i.jsx("span",{className:"section-name",children:e.name}),(0,i.jsxs)("span",{className:"section-count",children:["(",e.notes.filter(e=>e.trim()).length," notes)"]}),i.jsx("button",{onClick:t=>{t.stopPropagation(),q("action_sections",e.id)},className:"remove-section-btn",title:"Remove section",children:i.jsx(a.Z,{style:{width:"0.875rem",height:"0.875rem"}})})]}),I[e.id]&&i.jsx("div",{className:"section-notes",children:e.notes.map((t,s)=>(0,i.jsxs)("div",{className:"discussion-item section-note-item",children:[(0,i.jsxs)("div",{className:"discussion-number section-number",children:["A",s+1]}),i.jsx("textarea",{className:"discussion-input section-input",placeholder:`Enter ${e.name}'s action item...`,value:t,onChange:t=>J("action_sections",e.id,s,t.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>G("action_sections",e.id,s),className:"control-btn add",children:i.jsx(b.Z,{style:{width:"1rem",height:"1rem"}})}),e.notes.length>1&&i.jsx("button",{onClick:()=>V("action_sections",e.id,s),className:"control-btn",children:i.jsx(a.Z,{style:{width:"1rem",height:"1rem"}})})]})]},s))})]},e.id))]}),(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"},children:[(0,i.jsxs)("h2",{className:"section-title",style:{marginBottom:0},children:[i.jsx(p.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Next Steps"]}),(0,i.jsxs)("button",{onClick:()=>B(e=>({...e,next_step_sections:!e.next_step_sections})),className:"add-section-btn",title:"Add a new section",children:[i.jsx(f.Z,{style:{width:"1rem",height:"1rem"}}),"Add Section"]})]}),R.next_step_sections&&(0,i.jsxs)("div",{className:"add-section-input",children:[i.jsx("input",{type:"text",className:"form-input",placeholder:"Enter section name (e.g., Raminder, John)",value:Z.next_step_sections||"",onChange:e=>M(t=>({...t,next_step_sections:e.target.value})),onKeyPress:e=>"Enter"===e.key&&H("next_step_sections",Z.next_step_sections||"")}),i.jsx("button",{onClick:()=>H("next_step_sections",Z.next_step_sections||""),className:"add-btn",children:"Create"}),i.jsx("button",{onClick:()=>B(e=>({...e,next_step_sections:!1})),className:"cancel-section-btn",children:"Cancel"})]}),i.jsx("div",{className:"general-notes-label",children:"General Notes"}),o.next_steps.map((e,t)=>(0,i.jsxs)("div",{className:"discussion-item",children:[(0,i.jsxs)("div",{className:"discussion-number",children:["N",t+1]}),i.jsx("textarea",{className:"discussion-input",placeholder:"Enter next step...",value:e,onChange:e=>$("next_steps",t,e.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>P("next_steps",t),className:"control-btn add",children:i.jsx(b.Z,{style:{width:"1rem",height:"1rem"}})}),o.next_steps.length>1&&i.jsx("button",{onClick:()=>L("next_steps",t),className:"control-btn",children:i.jsx(a.Z,{style:{width:"1rem",height:"1rem"}})})]})]},t)),o.next_step_sections&&o.next_step_sections.map(e=>(0,i.jsxs)("div",{className:"section-container",children:[(0,i.jsxs)("div",{className:"section-header",onClick:()=>O(e.id),children:[I[e.id]?i.jsx(y.Z,{style:{width:"1rem",height:"1rem"}}):i.jsx(N.Z,{style:{width:"1rem",height:"1rem"}}),i.jsx(u.Z,{style:{width:"1.25rem",height:"1.25rem"}}),i.jsx("span",{className:"section-name",children:e.name}),(0,i.jsxs)("span",{className:"section-count",children:["(",e.notes.filter(e=>e.trim()).length," notes)"]}),i.jsx("button",{onClick:t=>{t.stopPropagation(),q("next_step_sections",e.id)},className:"remove-section-btn",title:"Remove section",children:i.jsx(a.Z,{style:{width:"0.875rem",height:"0.875rem"}})})]}),I[e.id]&&i.jsx("div",{className:"section-notes",children:e.notes.map((t,s)=>(0,i.jsxs)("div",{className:"discussion-item section-note-item",children:[(0,i.jsxs)("div",{className:"discussion-number section-number",children:["N",s+1]}),i.jsx("textarea",{className:"discussion-input section-input",placeholder:`Enter ${e.name}'s next step...`,value:t,onChange:t=>J("next_step_sections",e.id,s,t.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>G("next_step_sections",e.id,s),className:"control-btn add",children:i.jsx(b.Z,{style:{width:"1rem",height:"1rem"}})}),e.notes.length>1&&i.jsx("button",{onClick:()=>V("next_step_sections",e.id,s),className:"control-btn",children:i.jsx(a.Z,{style:{width:"1rem",height:"1rem"}})})]})]},s))})]},e.id))]})]}):i.jsx(()=>(0,i.jsxs)("div",{className:"document-view",children:[(0,i.jsxs)("div",{className:"document-header",children:[i.jsx("h1",{className:"document-title",children:"Meeting Notes"}),(0,i.jsxs)("div",{className:"document-meta",children:[(0,i.jsxs)("span",{className:"meta-item",children:[i.jsx("strong",{children:"Meeting:"})," ",o.title]}),(0,i.jsxs)("span",{className:"meta-item",children:[i.jsx("strong",{children:"Date:"})," ",(()=>{let[e,t,s]=o.date.split("-").map(Number),i=new Date(e,t-1,s);return i.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})})()]}),(0,i.jsxs)("span",{className:"meta-item",children:[i.jsx("strong",{children:"Time:"})," ",o.time]}),o.follow_up_date&&(0,i.jsxs)("span",{className:"meta-item",children:[i.jsx("strong",{children:"Follow-up Date:"})," ",(()=>{let[e,t,s]=o.follow_up_date.split("-").map(Number),i=new Date(e,t-1,s);return i.toLocaleDateString()})()]})]})]}),o.attendees.length>0&&(0,i.jsxs)("div",{className:"document-section",children:[i.jsx("h3",{className:"section-heading",children:"Attendees"}),i.jsx("div",{className:"attendees-grid",children:o.attendees.map((e,t)=>i.jsx("span",{className:"attendee-chip",children:e},t))})]}),(o.discussion_points.filter(e=>e.trim()).length>0||o.discussion_sections&&o.discussion_sections.length>0)&&(0,i.jsxs)("div",{className:"document-section",children:[i.jsx("h3",{className:"section-heading",children:"Key Discussion Points"}),o.discussion_points.filter(e=>e.trim()).length>0&&i.jsx("ol",{className:"discussion-list",children:o.discussion_points.filter(e=>e.trim()).map((e,t)=>i.jsx("li",{className:"discussion-item-doc",children:e},t))}),o.discussion_sections&&o.discussion_sections.map(e=>(0,i.jsxs)("div",{className:"sub-section",children:[(0,i.jsxs)("h4",{className:"sub-section-heading",children:[i.jsx(u.Z,{style:{width:"1rem",height:"1rem"}}),e.name]}),i.jsx("ol",{className:"discussion-list sub-list",children:e.notes.filter(e=>e.trim()).map((e,t)=>i.jsx("li",{className:"discussion-item-doc",children:e},t))})]},e.id))]}),(o.decisions_made.filter(e=>e.trim()).length>0||o.decision_sections&&o.decision_sections.length>0)&&(0,i.jsxs)("div",{className:"document-section",children:[i.jsx("h3",{className:"section-heading",children:"Decisions Made"}),o.decisions_made.filter(e=>e.trim()).length>0&&i.jsx("ul",{className:"decision-list",children:o.decisions_made.filter(e=>e.trim()).map((e,t)=>i.jsx("li",{className:"decision-item",children:e},t))}),o.decision_sections&&o.decision_sections.map(e=>(0,i.jsxs)("div",{className:"sub-section",children:[(0,i.jsxs)("h4",{className:"sub-section-heading",children:[i.jsx(u.Z,{style:{width:"1rem",height:"1rem"}}),e.name]}),i.jsx("ul",{className:"decision-list sub-list",children:e.notes.filter(e=>e.trim()).map((e,t)=>i.jsx("li",{className:"decision-item",children:e},t))})]},e.id))]}),(o.action_items.filter(e=>e.trim()).length>0||o.action_sections&&o.action_sections.length>0)&&(0,i.jsxs)("div",{className:"document-section",children:[i.jsx("h3",{className:"section-heading",children:"Action Items"}),o.action_items.filter(e=>e.trim()).length>0&&i.jsx("ul",{className:"action-list",children:o.action_items.filter(e=>e.trim()).map((e,t)=>(0,i.jsxs)("li",{className:"action-item",children:[(0,i.jsxs)("span",{className:"action-number",children:["A",t+1]}),e]},t))}),o.action_sections&&o.action_sections.map(e=>(0,i.jsxs)("div",{className:"sub-section",children:[(0,i.jsxs)("h4",{className:"sub-section-heading",children:[i.jsx(u.Z,{style:{width:"1rem",height:"1rem"}}),e.name]}),i.jsx("ul",{className:"action-list sub-list",children:e.notes.filter(e=>e.trim()).map((e,t)=>(0,i.jsxs)("li",{className:"action-item",children:[(0,i.jsxs)("span",{className:"action-number",children:["A",t+1]}),e]},t))})]},e.id))]}),(o.next_steps.filter(e=>e.trim()).length>0||o.next_step_sections&&o.next_step_sections.length>0)&&(0,i.jsxs)("div",{className:"document-section",children:[i.jsx("h3",{className:"section-heading",children:"Next Steps"}),o.next_steps.filter(e=>e.trim()).length>0&&i.jsx("ul",{className:"next-steps-list",children:o.next_steps.filter(e=>e.trim()).map((e,t)=>(0,i.jsxs)("li",{className:"next-step-item",children:[i.jsx("span",{className:"step-number",children:"→"}),e]},t))}),o.next_step_sections&&o.next_step_sections.map(e=>(0,i.jsxs)("div",{className:"sub-section",children:[(0,i.jsxs)("h4",{className:"sub-section-heading",children:[i.jsx(u.Z,{style:{width:"1rem",height:"1rem"}}),e.name]}),i.jsx("ul",{className:"next-steps-list sub-list",children:e.notes.filter(e=>e.trim()).map((e,t)=>(0,i.jsxs)("li",{className:"next-step-item",children:[i.jsx("span",{className:"step-number",children:"→"}),e]},t))})]},e.id))]}),i.jsx("div",{className:"document-footer",children:(0,i.jsxs)("button",{onClick:Q,className:"edit-btn",children:[i.jsx(p.Z,{style:{width:"1rem",height:"1rem"}}),"Edit Notes"]})})]}),{})}),z&&(0,i.jsxs)("div",{className:"save-section",children:[(0,i.jsxs)("button",{onClick:X,className:"save-btn",disabled:F,children:[i.jsx(p.Z,{style:{width:"1.25rem",height:"1.25rem"}}),F?"Saving...":"Save Meeting Notes"]}),i.jsx("button",{onClick:()=>{l?(r(l),E(!1)):t()},className:"cancel-btn",children:"Cancel"})]})]})]})}var D=s(95004);function k({meeting:e,occurrenceDate:t,onClose:u,onUpdate:b,onDelete:f,onFollowUp:j,projectMembers:y=[],projects:N=[],onProjectChange:v}){let[_,w]=(0,n.useState)(!1),[k,C]=(0,n.useState)(!1),[A,S]=(0,n.useState)({title:e.title,description:e.description,date:e.date,time:e.time,duration:e.duration,project_id:e.project_id||0,attendees:e.attendees||"",attendee_ids:e.attendee_ids||[],display_timezones:e.display_timezones||["UK","MM"],recurring:e.recurring||!1,recurring_end_date:e.recurring_end_date||""});(0,n.useEffect)(()=>{_&&A.project_id&&v&&v(A.project_id)},[A.project_id,_,v]);let z=e=>{let[t,s,i]=e.split("-").map(Number),n=new Date(t,s-1,i);return n.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})},E=async()=>{try{await b({...A,project:A.project_id,attendee_ids:A.attendee_ids,display_timezones:A.display_timezones,recurring:A.recurring,recurring_end_date:A.recurring&&A.recurring_end_date||null}),w(!1)}catch(e){console.error("Failed to update meeting:",e)}},[Z,M]=(0,n.useState)(!1),I=async()=>{if(e.recurring)M(!0);else if(window.confirm("Are you sure you want to delete this meeting?"))try{await f(e.id,"all"),u()}catch(e){console.error("Failed to delete meeting:",e)}},T=async()=>{try{await f(e.id,"this",t||void 0),M(!1),u()}catch(e){console.error("Failed to delete meeting:",e)}},R=async()=>{try{await f(e.id,"all"),M(!1),u()}catch(e){console.error("Failed to delete meeting:",e)}},[B,P]=(0,n.useState)([]),[$,L]=(0,n.useState)([]);return(0,n.useEffect)(()=>{let e=async()=>{try{let{userService:e}=await Promise.resolve().then(s.bind(s,44937)),t=await e.getUsers();L(t||[])}catch(e){console.error("Failed to fetch users:",e),L([])}};e()},[]),(0,n.useEffect)(()=>{if(e.attendee_ids&&e.attendee_ids.length>0&&$.length>0){let t=e.attendee_ids.map(e=>{let t=$.find(t=>t.id===e);if(t)return t.name||t.email?.split("@")[0]||"Unknown User";let s=y.find(t=>t.id===e);return s?s.name:`User ${e}`});P(t)}else e.attendees_list&&e.attendees_list.length>0?P(e.attendees_list):e.attendees&&"string"==typeof e.attendees?P(e.attendees.split(",").map(e=>e.trim()).filter(e=>e)):P([])},[e.attendee_ids,e.attendees_list,e.attendees,y,$]),(0,i.jsxs)("div",{className:"modal-overlay",onClick:u,children:[i.jsx("style",{dangerouslySetInnerHTML:{__html:`
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
            background: #1A1A1A;
            border: 1px solid #2D2D2D;
            border-radius: 16px;
            width: 100%;
            max-width: 520px;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            margin: 0 auto;
          }
          .meeting-modal-fixed {
            border: 1px solid #2D2D2D !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
            max-width: 520px !important;
            background: #1A1A1A !important;
          }
          .modal-content {
            padding: 0;
            border: none !important;
            box-shadow: none !important;
          }
          .modal-header {
            padding: 1.25rem 1.5rem;
            border-bottom: none;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            background: linear-gradient(135deg, #C77DFF 0%, #7B2FBE 50%, #3B82F6 100%);
            border-radius: 16px 16px 0 0;
          }
          .modal-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #FFFFFF;
            margin: 0;
            flex: 1;
            margin-right: 1rem;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          }
          .modal-actions {
            display: flex;
            gap: 0.5rem;
            flex-shrink: 0;
          }
          .action-btn {
            padding: 0.5rem;
            border: none;
            border-radius: 8px;
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(4px);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
          }
          .action-btn:hover {
            background: rgba(255,255,255,0.35);
            transform: translateY(-1px);
          }
          .action-btn.edit { background: rgba(255,255,255,0.2); }
          .action-btn.save { background: rgba(255,255,255,0.3); color: #ffffff; }
          .action-btn.delete { background: rgba(220,38,38,0.3); color: #FCA5A5; }
          .action-btn.delete:hover { background: rgba(220,38,38,0.5); }
          .action-btn.close { background: rgba(255,255,255,0.25); color: #FFFFFF; }
          .action-btn.close:hover { background: rgba(255,255,255,0.4); transform: translateY(-1px); }
          .modal-body {
            padding: 1.25rem 1.5rem;
          }
          .meeting-info {
            display: grid;
            gap: 0.625rem;
            margin-bottom: 1rem;
          }
          .info-row {
            display: flex;
            align-items: center;
            gap: 0.875rem;
            padding: 0.75rem 1rem;
            background: #141414;
            border: 1px solid #2D2D2D;
            border-radius: 10px;
            transition: border-color 0.2s;
          }
          .info-row:hover {
            border-color: #3D3D3D;
          }
          .info-icon {
            color: #C77DFF;
            flex-shrink: 0;
          }
          .info-content {
            flex: 1;
          }
          .info-label {
            font-size: 0.75rem;
            color: #71717A;
            margin-bottom: 0.25rem;
          }
          .info-value {
            font-weight: 600;
            color: #FFFFFF;
            font-size: 0.875rem;
          }
          .form-group {
            margin-bottom: 1rem;
          }
          .form-label {
            display: block;
            font-weight: 600;
            color: #FFFFFF;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
          }
          .form-input, .form-textarea, .form-select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #3D3D3D;
            border-radius: 6px;
            font-size: 0.875rem;
            transition: border-color 0.2s ease;
            box-sizing: border-box;
            background: #141414;
            color: #FFFFFF;
            color-scheme: dark;
          }
          .form-input:focus, .form-textarea:focus, .form-select:focus {
            outline: none;
            border-color: #3B82F6;
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
            border-top: 1px solid #2D2D2D;
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
            color: #FFFFFF;
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
            border-top: 1px solid #2D2D2D;
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
            background: #141414;
            color: #FFFFFF;
            border-color: #3D3D3D;
          }
          .btn-secondary:hover {
            border-color: #FFFFFF;
          }
          .attendees-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
          }
          .attendee-tag {
            background: linear-gradient(135deg, #C77DFF22, #3B82F622);
            color: #E4E4E7;
            padding: 0.3rem 0.65rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            border: 1px solid #3D3D3D;
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
        `}}),(0,i.jsxs)("div",{className:"meeting-modal meeting-modal-fixed",onClick:e=>e.stopPropagation(),children:[(0,i.jsxs)("div",{className:"modal-header",children:[i.jsx("h2",{className:"modal-title",children:_?"Edit Meeting":e.title}),(0,i.jsxs)("div",{className:"modal-actions",children:[_?i.jsx("button",{onClick:E,className:"action-btn save",title:"Save changes",children:i.jsx(l.Z,{style:{width:"16px",height:"16px"}})}):(0,i.jsxs)(i.Fragment,{children:[j&&(0,i.jsxs)("button",{onClick:()=>{u(),j(e)},className:"action-btn",title:"Schedule follow-up meeting",style:{background:"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",color:"#fff",display:"flex",alignItems:"center",gap:"4px",padding:"6px 12px",borderRadius:"6px",fontSize:"12px",fontWeight:"600"},children:[i.jsx(o.Z,{style:{width:"14px",height:"14px"}}),"Follow-up"]}),i.jsx("button",{onClick:()=>w(!0),className:"action-btn edit",title:"Edit meeting",children:i.jsx(r.Z,{style:{width:"16px",height:"16px"}})}),(0,i.jsxs)("div",{style:{position:"relative"},children:[i.jsx("button",{onClick:I,className:"action-btn delete",title:"Delete meeting",children:i.jsx(a.Z,{style:{width:"16px",height:"16px"}})}),Z&&(0,i.jsxs)("div",{style:{position:"absolute",top:"100%",right:0,marginTop:"8px",background:"#1A1A1A",border:"1px solid #3D3D3D",borderRadius:"10px",padding:"8px",zIndex:100,minWidth:"200px",boxShadow:"0 8px 24px rgba(0,0,0,0.4)"},children:[i.jsx("button",{onClick:T,style:{display:"block",width:"100%",padding:"10px 14px",background:"transparent",border:"none",color:"#E4E4E7",fontSize:"0.875rem",textAlign:"left",borderRadius:"6px",cursor:"pointer"},onMouseEnter:e=>e.currentTarget.style.background="#2D2D2D",onMouseLeave:e=>e.currentTarget.style.background="transparent",children:"Delete this day only"}),i.jsx("button",{onClick:R,style:{display:"block",width:"100%",padding:"10px 14px",background:"transparent",border:"none",color:"#EF4444",fontSize:"0.875rem",textAlign:"left",borderRadius:"6px",cursor:"pointer"},onMouseEnter:e=>e.currentTarget.style.background="#2D2D2D",onMouseLeave:e=>e.currentTarget.style.background="transparent",children:"Delete all occurrences"}),i.jsx("button",{onClick:()=>M(!1),style:{display:"block",width:"100%",padding:"10px 14px",background:"transparent",border:"none",color:"#71717A",fontSize:"0.875rem",textAlign:"left",borderRadius:"6px",cursor:"pointer"},onMouseEnter:e=>e.currentTarget.style.background="#2D2D2D",onMouseLeave:e=>e.currentTarget.style.background="transparent",children:"Cancel"})]})]})]}),i.jsx("button",{onClick:u,className:"action-btn close",title:"Close",children:i.jsx(d.Z,{style:{width:"16px",height:"16px"}})})]})]}),i.jsx("div",{className:"modal-content",children:(0,i.jsxs)("div",{className:"modal-body",children:[_?(0,i.jsxs)("div",{className:"edit-form",children:[(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Meeting Title *"}),i.jsx("input",{type:"text",required:!0,className:"form-input",placeholder:"Enter meeting title...",value:A.title,onChange:e=>S({...A,title:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Description"}),i.jsx("textarea",{className:"form-textarea",placeholder:"What will be discussed in this meeting?",value:A.description,onChange:e=>S({...A,description:e.target.value}),style:{minHeight:"80px",resize:"vertical"}})]}),N.length>0&&(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Project *"}),(0,i.jsxs)("select",{required:!0,className:"form-select",value:A.project_id,onChange:e=>S({...A,project_id:Number(e.target.value),attendee_ids:[]}),children:[i.jsx("option",{value:0,children:"Select a project"}),N.map(e=>i.jsx("option",{value:e.id,children:e.name},e.id))]})]}),(0,i.jsxs)("div",{className:"form-grid-3",children:[(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Date *"}),i.jsx("input",{type:"date",required:!0,className:"form-input",value:A.date,onChange:e=>S({...A,date:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Time *"}),i.jsx("input",{type:"time",required:!0,className:"form-input",value:A.time,onChange:e=>S({...A,time:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Duration"}),i.jsx("input",{type:"number",min:"15",max:"480",step:"15",className:"form-input",placeholder:"Minutes",value:A.duration,onChange:e=>S({...A,duration:Number(e.target.value)})})]})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Show timezones"}),i.jsx("div",{style:{display:"flex",gap:"12px",flexWrap:"wrap",padding:"8px 0"},children:D.p5.map(e=>(0,i.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",color:"#A1A1AA",fontSize:"0.875rem"},children:[i.jsx("input",{type:"checkbox",checked:A.display_timezones.includes(e),onChange:t=>{let s=t.target.checked;S(t=>({...t,display_timezones:s?[...t.display_timezones,e]:t.display_timezones.filter(t=>t!==e)}))},style:{cursor:"pointer"}}),i.jsx("span",{style:{color:D.z[e].color,fontWeight:"600"},children:D.z[e].label})]},e))})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Invite Attendees (Optional)"}),A.attendee_ids.length>0&&i.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.5rem",marginBottom:"0.75rem",padding:"0.75rem",backgroundColor:"#141414",border:"1px solid #2D2D2D",borderRadius:"6px"},children:A.attendee_ids.map(e=>{let t=y.find(t=>t.id===e);return t?(0,i.jsxs)("span",{style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.25rem 0.75rem",backgroundColor:"#000000",color:"#ffffff",borderRadius:"20px",fontSize:"0.875rem"},children:[t.name,i.jsx("button",{type:"button",onClick:()=>S(t=>({...t,attendee_ids:t.attendee_ids.filter(t=>t!==e)})),style:{background:"none",border:"none",color:"#ffffff",cursor:"pointer",fontSize:"1rem",lineHeight:"1"},children:"\xd7"})]},e):null})}),y.length>0?i.jsx("div",{style:{border:"2px solid #3D3D3D",borderRadius:"6px",maxHeight:"200px",overflowY:"auto"},children:y.map(e=>{let t=A.attendee_ids.includes(e.id);return(0,i.jsxs)("div",{onClick:()=>{S(s=>({...s,attendee_ids:t?s.attendee_ids.filter(t=>t!==e.id):[...s.attendee_ids,e.id]}))},style:{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",borderBottom:"1px solid #2D2D2D",cursor:"pointer",backgroundColor:t?"rgba(59, 130, 246, 0.2)":"#141414",borderLeft:t?"4px solid #3B82F6":"4px solid transparent"},children:[i.jsx("input",{type:"checkbox",checked:t,onChange:()=>{},style:{cursor:"pointer"}}),(0,i.jsxs)("div",{style:{flex:1},children:[i.jsx("div",{style:{fontWeight:"500",color:"#FFFFFF"},children:e.name}),i.jsx("div",{style:{fontSize:"0.875rem",color:"#71717A"},children:e.email})]})]},e.id)})}):i.jsx("div",{style:{padding:"2rem",textAlign:"center",color:"#71717A",border:"2px dashed #3D3D3D",borderRadius:"6px"},children:A.project_id?"Loading project members...":"Select a project to see available members"})]}),i.jsx("div",{className:"form-group",children:(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"#141414",border:"2px solid #3D3D3D",borderRadius:"6px"},children:[(0,i.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"8px",color:"#FFFFFF",fontSize:"0.875rem",fontWeight:600},children:[i.jsx(o.Z,{style:{width:"18px",height:"18px",color:"#C77DFF"}}),"Recurring Meeting"]}),i.jsx("div",{onClick:()=>S({...A,recurring:!A.recurring}),style:{width:"48px",height:"24px",background:A.recurring?"#C77DFF":"#3D3D3D",borderRadius:"12px",position:"relative",cursor:"pointer",transition:"background 0.2s"},children:i.jsx("div",{style:{width:"20px",height:"20px",background:"#FFFFFF",borderRadius:"50%",position:"absolute",top:"2px",left:A.recurring?"26px":"2px",transition:"left 0.2s"}})})]})}),A.recurring&&(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"End Date"}),i.jsx("input",{type:"date",className:"form-input",value:A.recurring_end_date,onChange:e=>S({...A,recurring_end_date:e.target.value}),min:A.date||void 0,style:{colorScheme:"dark"}})]}),(0,i.jsxs)("div",{className:"form-actions",children:[i.jsx("button",{onClick:E,className:"btn btn-primary",children:"Update Meeting"}),i.jsx("button",{onClick:()=>w(!1),className:"btn btn-secondary",children:"Cancel"})]})]}):(0,i.jsxs)("div",{className:"meeting-info",children:[(0,i.jsxs)("div",{className:"info-row",children:[i.jsx(c.Z,{className:"info-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Date"}),i.jsx("div",{className:"info-value",children:z(e.date)})]})]}),(0,i.jsxs)("div",{className:"info-row",style:{alignItems:"flex-start"},children:[i.jsx(m.Z,{className:"info-icon",style:{width:"20px",height:"20px",marginTop:"2px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Time & Duration"}),(0,i.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"4px"},children:[(0,D.XY)(e.time,e.display_timezones||["UK","MM"]).map(e=>(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"6px"},children:[i.jsx("span",{style:{fontWeight:"700",color:e.config.color,fontSize:"11px",minWidth:"22px"},children:e.config.shortLabel}),i.jsx("span",{className:"info-value",style:{color:e.config.color},children:e.formatted}),e.dateLabel&&i.jsx("span",{style:{color:"#EF4444",fontSize:"10px",fontWeight:"600"},children:e.dateLabel})]},e.timezone)),i.jsx("div",{style:{color:"#71717A",fontSize:"12px",marginTop:"2px"},children:(e=>{let t=Math.floor(e/60),s=e%60;return t>0?s>0?`${t}h ${s}m`:`${t}h`:`${s}m`})(e.duration)})]})]})]}),(0,i.jsxs)("div",{className:"info-row",children:[i.jsx(p.Z,{className:"info-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Project"}),i.jsx("div",{className:"info-value",children:e.project_name})]})]}),e.description&&(0,i.jsxs)("div",{className:"info-row",children:[i.jsx(h.Z,{className:"info-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Description"}),i.jsx("div",{className:"info-value",children:e.description})]})]}),B.length>0&&(0,i.jsxs)("div",{className:"info-row",children:[i.jsx(x.Z,{className:"info-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Attendees"}),i.jsx("div",{className:"attendees-list",children:B.map((e,t)=>i.jsx("span",{className:"attendee-tag",children:e},t))})]})]}),e.recurring&&(0,i.jsxs)("div",{className:"info-row",children:[i.jsx(o.Z,{className:"info-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Recurring"}),(0,i.jsxs)("div",{className:"info-value",children:["Daily until ",e.recurring_end_date?z(e.recurring_end_date):"N/A"]})]})]}),e.agenda_items&&e.agenda_items.length>0&&(0,i.jsxs)("div",{className:"info-row",style:{alignItems:"flex-start"},children:[i.jsx(g.Z,{className:"info-icon",style:{width:"20px",height:"20px",marginTop:"2px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Meeting Agenda"}),i.jsx("div",{style:{marginTop:"8px",background:"#141414",borderRadius:"8px",overflow:"hidden",border:"1px solid #2D2D2D"},children:e.agenda_items.map((t,s)=>(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"12px",padding:"10px 12px",borderBottom:s<e.agenda_items.length-1?"1px solid #2D2D2D":"none",background:"#1A1A1A"},children:[i.jsx("span",{style:{width:"22px",height:"22px",borderRadius:"50%",background:"#5884FD",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"700",flexShrink:0},children:s+1}),i.jsx("span",{style:{fontSize:"13px",color:"#E4E4E7"},children:t})]},s))})]})]})]}),(0,i.jsxs)("div",{style:{display:"flex",gap:"12px",flexWrap:"wrap",padding:"16px 0",borderTop:"1px solid #2D2D2D",marginTop:"16px"},children:[j&&(0,i.jsxs)("button",{onClick:()=>{u(),j(e)},style:{display:"flex",alignItems:"center",gap:"8px",padding:"12px 20px",background:"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",color:"#fff",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",transition:"all 0.2s ease",boxShadow:"0 2px 8px rgba(59, 130, 246, 0.3)"},children:[i.jsx(o.Z,{style:{width:"18px",height:"18px"}}),"Schedule Follow-up Meeting"]}),(0,i.jsxs)("button",{onClick:()=>C(!0),style:{display:"flex",alignItems:"center",gap:"8px",padding:"12px 20px",background:"#2D2D2D",color:"#E4E4E7",border:"1px solid #3D3D3D",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",transition:"all 0.2s ease"},children:[i.jsx(g.Z,{style:{width:"18px",height:"18px"}}),"Meeting Notes"]})]})]})})]}),k&&i.jsx(F,{meeting:{id:e.id,title:e.title,date:e.date,time:e.time,duration:e.duration,attendees_list:B},onClose:()=>C(!1),projectMembers:y})]})}},95004:(e,t,s)=>{s.d(t,{Ms:()=>r,XY:()=>l,hY:()=>a,p5:()=>n,rJ:()=>o,z:()=>i});let i={UK:{key:"UK",label:"UK (GMT)",shortLabel:"UK",offsetMinutes:0,color:"#0369A1",bgColor:"#F0F9FF"},MM:{key:"MM",label:"Myanmar (MMT)",shortLabel:"MM",offsetMinutes:390,color:"#B45309",bgColor:"#FFFBEB"},TH:{key:"TH",label:"Thailand (ICT)",shortLabel:"TH",offsetMinutes:420,color:"#047857",bgColor:"#ECFDF5"}},n=["UK","MM","TH"];function o(e,t,s){if(!e||t===s)return{time:e,dateDelta:0};let[n,o]=e.split(":").map(Number),r=i[t].offsetMinutes,a=i[s].offsetMinutes,l=0,d=60*n+o+(a-r);d>=1440?(d-=1440,l=1):d<0&&(d+=1440,l=-1);let c=Math.floor(d/60),m=d%60;return{time:`${String(c).padStart(2,"0")}:${String(m).padStart(2,"0")}`,dateDelta:l}}function r(e,t){return o(e,t,"UK")}function a(e,t){if(0===t)return e;let[s,i,n]=e.split("-").map(Number),o=new Date(s,i-1,n);o.setDate(o.getDate()+t);let r=o.getFullYear(),a=String(o.getMonth()+1).padStart(2,"0"),l=String(o.getDate()).padStart(2,"0");return`${r}-${a}-${l}`}function l(e,t){return t.map(t=>{let{time:s,dateDelta:n}=o(e,"UK",t),r=i[t];return{timezone:t,config:r,time:s,formatted:function(e){if(!e)return"";let[t,s]=e.split(":").map(Number);return`${t%12||12}:${String(s).padStart(2,"0")} ${t>=12?"PM":"AM"}`}(s),dateDelta:n,dateLabel:1===n?"(+1 day)":-1===n?"(-1 day)":""}})}}};