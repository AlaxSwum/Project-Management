"use strict";exports.id=1111,exports.ids=[1111],exports.modules={71111:(e,s,t)=>{t.d(s,{Z:()=>D});var i=t(53854),n=t(34218),o=t(32399),r=t(70856),a=t(71888),l=t(74448),d=t(96835),c=t(89618),m=t(54791),h=t(82244),p=t(61685),x=t(2769),g=t(26965),u=t(34148),f=t(18998),b=t(97530),j=t(95880),N=t(8041),v=t(67689),y=t(20199);class _{async getMeetingNotes(e){try{let s=(await Promise.resolve().then(t.bind(t,2132))).supabase,{data:i,error:n}=await s.from("meeting_notes").select("*").eq("meeting_id",e).single();if(n)return console.error("Error fetching meeting notes:",n),null;return i}catch(e){return console.error("Error in getMeetingNotes:",e),null}}async createMeetingNotes(e){try{let s=(await Promise.resolve().then(t.bind(t,2132))).supabase,{data:i,error:n}=await s.from("meeting_notes").insert([e]).select().single();if(n)throw Error(`Failed to create meeting notes: ${n.message}`);return i}catch(e){throw console.error("Error in createMeetingNotes:",e),e}}async updateMeetingNotes(e,s){try{let i=(await Promise.resolve().then(t.bind(t,2132))).supabase,{data:n,error:o}=await i.from("meeting_notes").update({...s,updated_at:new Date().toISOString()}).eq("id",e).select().single();if(o)throw Error(`Failed to update meeting notes: ${o.message}`);return n}catch(e){throw console.error("Error in updateMeetingNotes:",e),e}}async deleteMeetingNotes(e){try{let s=(await Promise.resolve().then(t.bind(t,2132))).supabase,{error:i}=await s.from("meeting_notes").delete().eq("id",e);if(i)throw Error(`Failed to delete meeting notes: ${i.message}`)}catch(e){throw console.error("Error in deleteMeetingNotes:",e),e}}}let w=new _;function F({meeting:e,onClose:s,projectMembers:t=[]}){let[o,r]=(0,n.useState)({meeting_id:e.id,title:e.title,date:e.date,time:e.time,attendees:e.attendees_list||[],discussion_points:[""],decisions_made:[""],action_items:[""],next_steps:[""],discussion_sections:[],decision_sections:[],action_sections:[],next_step_sections:[],follow_up_date:""}),[l,c]=(0,n.useState)(null),[m,_]=(0,n.useState)(!0),[F,D]=(0,n.useState)(!1),[k,C]=(0,n.useState)(""),[A,Z]=(0,n.useState)(null),[E,S]=(0,n.useState)(!1),[z,M]=(0,n.useState)({}),[I,P]=(0,n.useState)({}),[R,B]=(0,n.useState)({});(0,n.useEffect)(()=>{let s=async()=>{try{let s=await w.getMeetingNotes(e.id);s?(c(s),r({...s,discussion_points:s.discussion_points.length>0?s.discussion_points:[""],decisions_made:s.decisions_made.length>0?s.decisions_made:[""],action_items:s.action_items.length>0?s.action_items:[""],next_steps:s.next_steps.length>0?s.next_steps:[""],discussion_sections:s.discussion_sections||[],decision_sections:s.decision_sections||[],action_sections:s.action_sections||[],next_step_sections:s.next_step_sections||[]}),S(!1)):S(!0)}catch(e){console.error("Failed to load meeting notes:",e),S(!0)}finally{_(!1)}};s()},[e.id]);let T=(e,s)=>{r(t=>{let i=t[e];if(void 0===s)return{...t,[e]:[...i,""]};{let n=[...i];return n.splice(s+1,0,""),{...t,[e]:n}}})},$=(e,s,t)=>{r(i=>{let n=i[e],o=[...n];return o[s]=t,{...i,[e]:o}})},Y=(e,s)=>{r(t=>{let i=t[e];if(i.length>1){let n=i.filter((e,t)=>t!==s);return{...t,[e]:n}}return t})},L=()=>{k.trim()&&(r(e=>({...e,attendees:[...e.attendees,k.trim()]})),C(""))},U=e=>{r(s=>({...s,attendees:s.attendees.filter((s,t)=>t!==e)}))},W=e=>{o.attendees.includes(e.name)||r(s=>({...s,attendees:[...s.attendees,e.name]}))},q=()=>`section-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,H=(e,s)=>{if(!s.trim())return;let t={id:q(),name:s.trim(),notes:[""]};r(s=>({...s,[e]:[...s[e]||[],t]})),M(s=>({...s,[e]:""})),B(s=>({...s,[e]:!1})),P(e=>({...e,[t.id]:!0}))},K=(e,s)=>{r(t=>({...t,[e]:(t[e]||[]).filter(e=>e.id!==s)}))},G=(e,s,t)=>{r(i=>({...i,[e]:(i[e]||[]).map(e=>{if(e.id===s){let s=[...e.notes];return void 0!==t?s.splice(t+1,0,""):s.push(""),{...e,notes:s}}return e})}))},J=(e,s,t,i)=>{r(n=>({...n,[e]:(n[e]||[]).map(e=>{if(e.id===s){let s=[...e.notes];return s[t]=i,{...e,notes:s}}return e})}))},V=(e,s,t)=>{r(i=>({...i,[e]:(i[e]||[]).map(e=>e.id===s&&e.notes.length>1?{...e,notes:e.notes.filter((e,s)=>s!==t)}:e)}))},O=e=>{P(s=>({...s,[e]:!s[e]}))},Q=async()=>{D(!0);try{let e;let s=e=>e?e.map(e=>({...e,notes:e.notes.filter(e=>e.trim())})).filter(e=>e.notes.length>0):[],t={...o,discussion_points:o.discussion_points.filter(e=>e.trim()),decisions_made:o.decisions_made.filter(e=>e.trim()),action_items:o.action_items.filter(e=>e.trim()),next_steps:o.next_steps.filter(e=>e.trim()),discussion_sections:s(o.discussion_sections),decision_sections:s(o.decision_sections),action_sections:s(o.action_sections),next_step_sections:s(o.next_step_sections),follow_up_date:o.follow_up_date?.trim()||null};e=l?.id?await w.updateMeetingNotes(l.id,t):await w.createMeetingNotes(t),c(e),r(e),S(!1),alert("Meeting notes saved successfully!")}catch(e){console.error("Failed to save meeting notes:",e),alert("Failed to save meeting notes")}finally{D(!1)}},X=()=>{S(!0)},ee=e=>{Z(e)};return m?(0,i.jsxs)("div",{className:"modal-overlay",onClick:s,children:[i.jsx("div",{className:"notes-modal",onClick:e=>e.stopPropagation(),children:(0,i.jsxs)("div",{className:"loading-container",children:[i.jsx("div",{className:"loading-spinner"}),i.jsx("p",{children:"Loading meeting notes..."})]})}),i.jsx("style",{dangerouslySetInnerHTML:{__html:`
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
          `}})]}):(0,i.jsxs)("div",{className:"modal-overlay",onClick:s,children:[i.jsx("style",{dangerouslySetInnerHTML:{__html:`
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
        `}}),(0,i.jsxs)("div",{className:"notes-modal",onClick:e=>e.stopPropagation(),children:[(0,i.jsxs)("div",{className:"notes-header",children:[(0,i.jsxs)("h1",{className:"notes-title",children:[i.jsx(h.Z,{style:{width:"2rem",height:"2rem"}}),"Meeting Notes"]}),i.jsx("button",{onClick:s,className:"close-btn",children:i.jsx(d.Z,{style:{width:"1.5rem",height:"1.5rem"}})})]}),i.jsx("div",{className:"notes-content",children:E?(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("h2",{className:"section-title",children:[i.jsx(g.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Meeting Information"]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Meeting Title"}),i.jsx("input",{type:"text",className:"form-input",value:o.title,onChange:e=>r({...o,title:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-row-three",children:[(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Date"}),i.jsx("input",{type:"date",className:"form-input",value:o.date,onChange:e=>r({...o,date:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Time"}),i.jsx("input",{type:"time",className:"form-input",value:o.time,onChange:e=>r({...o,time:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Follow-up Date"}),i.jsx("input",{type:"date",className:"form-input",value:o.follow_up_date||"",onChange:e=>r({...o,follow_up_date:e.target.value})})]})]})]}),(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("h2",{className:"section-title",children:[i.jsx(x.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Attendees"]}),i.jsx("div",{className:"attendees-container",children:o.attendees.map((e,s)=>(0,i.jsxs)("div",{className:"attendee-tag",children:[e,i.jsx("span",{onClick:()=>U(s),className:"attendee-remove",children:"\xd7"})]},s))}),(0,i.jsxs)("div",{className:"attendee-input-row",children:[i.jsx("input",{type:"text",className:"form-input",placeholder:"Add attendee...",value:k,onChange:e=>C(e.target.value),onKeyPress:e=>"Enter"===e.key&&L()}),(0,i.jsxs)("button",{onClick:L,className:"add-btn",children:[i.jsx(f.Z,{style:{width:"1rem",height:"1rem"}}),"Add"]})]}),t.length>0&&(0,i.jsxs)("div",{className:"project-members",children:[i.jsx("span",{style:{fontSize:"0.75rem",color:"#71717A",marginRight:"0.5rem"},children:"Quick add:"}),t.map((e,s)=>i.jsx("button",{onClick:()=>W(e),className:"member-btn",children:e.name},s))]})]}),(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"},children:[(0,i.jsxs)("h2",{className:"section-title",style:{marginBottom:0},children:[i.jsx(p.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Key Discussion Points"]}),(0,i.jsxs)("button",{onClick:()=>B(e=>({...e,discussion_sections:!e.discussion_sections})),className:"add-section-btn",title:"Add a new section",children:[i.jsx(b.Z,{style:{width:"1rem",height:"1rem"}}),"Add Section"]})]}),R.discussion_sections&&(0,i.jsxs)("div",{className:"add-section-input",children:[i.jsx("input",{type:"text",className:"form-input",placeholder:"Enter section name (e.g., Raminder, John)",value:z.discussion_sections||"",onChange:e=>M(s=>({...s,discussion_sections:e.target.value})),onKeyPress:e=>"Enter"===e.key&&H("discussion_sections",z.discussion_sections||"")}),i.jsx("button",{onClick:()=>H("discussion_sections",z.discussion_sections||""),className:"add-btn",children:"Create"}),i.jsx("button",{onClick:()=>B(e=>({...e,discussion_sections:!1})),className:"cancel-section-btn",children:"Cancel"})]}),i.jsx("div",{className:"general-notes-label",children:"General Notes"}),o.discussion_points.map((e,s)=>(0,i.jsxs)("div",{children:[A===s&&s>0&&(0,i.jsxs)("div",{className:"previous-line",children:["Previous: ",o.discussion_points[s-1]||"No previous discussion point"]}),(0,i.jsxs)("div",{className:"discussion-item",children:[i.jsx("div",{className:"discussion-number",children:s+1}),i.jsx("textarea",{className:`discussion-input ${A===s?"active":""}`,placeholder:"Enter discussion point...",value:e,onChange:e=>$("discussion_points",s,e.target.value),onFocus:()=>ee(s)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>T("discussion_points",s),className:"control-btn add",title:"Add discussion point after this one",children:i.jsx(f.Z,{style:{width:"1rem",height:"1rem"}})}),o.discussion_points.length>1&&i.jsx("button",{onClick:()=>Y("discussion_points",s),className:"control-btn",title:"Remove this discussion point",children:i.jsx(a.Z,{style:{width:"1rem",height:"1rem"}})}),s>0&&i.jsx("button",{onClick:()=>Z(A===s?null:s),className:"control-btn",title:"Show previous line",children:i.jsx(j.Z,{style:{width:"1rem",height:"1rem"}})})]})]})]},s)),o.discussion_sections&&o.discussion_sections.map(e=>(0,i.jsxs)("div",{className:"section-container",children:[(0,i.jsxs)("div",{className:"section-header",onClick:()=>O(e.id),children:[I[e.id]?i.jsx(N.Z,{style:{width:"1rem",height:"1rem"}}):i.jsx(v.Z,{style:{width:"1rem",height:"1rem"}}),i.jsx(u.Z,{style:{width:"1.25rem",height:"1.25rem"}}),i.jsx("span",{className:"section-name",children:e.name}),(0,i.jsxs)("span",{className:"section-count",children:["(",e.notes.filter(e=>e.trim()).length," notes)"]}),i.jsx("button",{onClick:s=>{s.stopPropagation(),K("discussion_sections",e.id)},className:"remove-section-btn",title:"Remove section",children:i.jsx(a.Z,{style:{width:"0.875rem",height:"0.875rem"}})})]}),I[e.id]&&i.jsx("div",{className:"section-notes",children:e.notes.map((s,t)=>(0,i.jsxs)("div",{className:"discussion-item section-note-item",children:[i.jsx("div",{className:"discussion-number section-number",children:t+1}),i.jsx("textarea",{className:"discussion-input section-input",placeholder:`Enter ${e.name}'s note...`,value:s,onChange:s=>J("discussion_sections",e.id,t,s.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>G("discussion_sections",e.id,t),className:"control-btn add",title:"Add note after this one",children:i.jsx(f.Z,{style:{width:"1rem",height:"1rem"}})}),e.notes.length>1&&i.jsx("button",{onClick:()=>V("discussion_sections",e.id,t),className:"control-btn",title:"Remove note",children:i.jsx(a.Z,{style:{width:"1rem",height:"1rem"}})})]})]},t))})]},e.id))]}),(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"},children:[(0,i.jsxs)("h2",{className:"section-title",style:{marginBottom:0},children:[i.jsx(y.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Decisions Made"]}),(0,i.jsxs)("button",{onClick:()=>B(e=>({...e,decision_sections:!e.decision_sections})),className:"add-section-btn",title:"Add a new section",children:[i.jsx(b.Z,{style:{width:"1rem",height:"1rem"}}),"Add Section"]})]}),R.decision_sections&&(0,i.jsxs)("div",{className:"add-section-input",children:[i.jsx("input",{type:"text",className:"form-input",placeholder:"Enter section name (e.g., Raminder, John)",value:z.decision_sections||"",onChange:e=>M(s=>({...s,decision_sections:e.target.value})),onKeyPress:e=>"Enter"===e.key&&H("decision_sections",z.decision_sections||"")}),i.jsx("button",{onClick:()=>H("decision_sections",z.decision_sections||""),className:"add-btn",children:"Create"}),i.jsx("button",{onClick:()=>B(e=>({...e,decision_sections:!1})),className:"cancel-section-btn",children:"Cancel"})]}),i.jsx("div",{className:"general-notes-label",children:"General Notes"}),o.decisions_made.map((e,s)=>(0,i.jsxs)("div",{className:"discussion-item",children:[(0,i.jsxs)("div",{className:"discussion-number",children:["D",s+1]}),i.jsx("textarea",{className:"discussion-input",placeholder:"Enter decision made...",value:e,onChange:e=>$("decisions_made",s,e.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>T("decisions_made",s),className:"control-btn add",children:i.jsx(f.Z,{style:{width:"1rem",height:"1rem"}})}),o.decisions_made.length>1&&i.jsx("button",{onClick:()=>Y("decisions_made",s),className:"control-btn",children:i.jsx(a.Z,{style:{width:"1rem",height:"1rem"}})})]})]},s)),o.decision_sections&&o.decision_sections.map(e=>(0,i.jsxs)("div",{className:"section-container",children:[(0,i.jsxs)("div",{className:"section-header",onClick:()=>O(e.id),children:[I[e.id]?i.jsx(N.Z,{style:{width:"1rem",height:"1rem"}}):i.jsx(v.Z,{style:{width:"1rem",height:"1rem"}}),i.jsx(u.Z,{style:{width:"1.25rem",height:"1.25rem"}}),i.jsx("span",{className:"section-name",children:e.name}),(0,i.jsxs)("span",{className:"section-count",children:["(",e.notes.filter(e=>e.trim()).length," notes)"]}),i.jsx("button",{onClick:s=>{s.stopPropagation(),K("decision_sections",e.id)},className:"remove-section-btn",title:"Remove section",children:i.jsx(a.Z,{style:{width:"0.875rem",height:"0.875rem"}})})]}),I[e.id]&&i.jsx("div",{className:"section-notes",children:e.notes.map((s,t)=>(0,i.jsxs)("div",{className:"discussion-item section-note-item",children:[(0,i.jsxs)("div",{className:"discussion-number section-number",children:["D",t+1]}),i.jsx("textarea",{className:"discussion-input section-input",placeholder:`Enter ${e.name}'s decision...`,value:s,onChange:s=>J("decision_sections",e.id,t,s.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>G("decision_sections",e.id,t),className:"control-btn add",children:i.jsx(f.Z,{style:{width:"1rem",height:"1rem"}})}),e.notes.length>1&&i.jsx("button",{onClick:()=>V("decision_sections",e.id,t),className:"control-btn",children:i.jsx(a.Z,{style:{width:"1rem",height:"1rem"}})})]})]},t))})]},e.id))]}),(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"},children:[(0,i.jsxs)("h2",{className:"section-title",style:{marginBottom:0},children:[i.jsx(h.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Action Items"]}),(0,i.jsxs)("button",{onClick:()=>B(e=>({...e,action_sections:!e.action_sections})),className:"add-section-btn",title:"Add a new section",children:[i.jsx(b.Z,{style:{width:"1rem",height:"1rem"}}),"Add Section"]})]}),R.action_sections&&(0,i.jsxs)("div",{className:"add-section-input",children:[i.jsx("input",{type:"text",className:"form-input",placeholder:"Enter section name (e.g., Raminder, John)",value:z.action_sections||"",onChange:e=>M(s=>({...s,action_sections:e.target.value})),onKeyPress:e=>"Enter"===e.key&&H("action_sections",z.action_sections||"")}),i.jsx("button",{onClick:()=>H("action_sections",z.action_sections||""),className:"add-btn",children:"Create"}),i.jsx("button",{onClick:()=>B(e=>({...e,action_sections:!1})),className:"cancel-section-btn",children:"Cancel"})]}),i.jsx("div",{className:"general-notes-label",children:"General Notes"}),o.action_items.map((e,s)=>(0,i.jsxs)("div",{className:"discussion-item",children:[(0,i.jsxs)("div",{className:"discussion-number",children:["A",s+1]}),i.jsx("textarea",{className:"discussion-input",placeholder:"Enter action item...",value:e,onChange:e=>$("action_items",s,e.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>T("action_items",s),className:"control-btn add",children:i.jsx(f.Z,{style:{width:"1rem",height:"1rem"}})}),o.action_items.length>1&&i.jsx("button",{onClick:()=>Y("action_items",s),className:"control-btn",children:i.jsx(a.Z,{style:{width:"1rem",height:"1rem"}})})]})]},s)),o.action_sections&&o.action_sections.map(e=>(0,i.jsxs)("div",{className:"section-container",children:[(0,i.jsxs)("div",{className:"section-header",onClick:()=>O(e.id),children:[I[e.id]?i.jsx(N.Z,{style:{width:"1rem",height:"1rem"}}):i.jsx(v.Z,{style:{width:"1rem",height:"1rem"}}),i.jsx(u.Z,{style:{width:"1.25rem",height:"1.25rem"}}),i.jsx("span",{className:"section-name",children:e.name}),(0,i.jsxs)("span",{className:"section-count",children:["(",e.notes.filter(e=>e.trim()).length," notes)"]}),i.jsx("button",{onClick:s=>{s.stopPropagation(),K("action_sections",e.id)},className:"remove-section-btn",title:"Remove section",children:i.jsx(a.Z,{style:{width:"0.875rem",height:"0.875rem"}})})]}),I[e.id]&&i.jsx("div",{className:"section-notes",children:e.notes.map((s,t)=>(0,i.jsxs)("div",{className:"discussion-item section-note-item",children:[(0,i.jsxs)("div",{className:"discussion-number section-number",children:["A",t+1]}),i.jsx("textarea",{className:"discussion-input section-input",placeholder:`Enter ${e.name}'s action item...`,value:s,onChange:s=>J("action_sections",e.id,t,s.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>G("action_sections",e.id,t),className:"control-btn add",children:i.jsx(f.Z,{style:{width:"1rem",height:"1rem"}})}),e.notes.length>1&&i.jsx("button",{onClick:()=>V("action_sections",e.id,t),className:"control-btn",children:i.jsx(a.Z,{style:{width:"1rem",height:"1rem"}})})]})]},t))})]},e.id))]}),(0,i.jsxs)("div",{className:"form-section",children:[(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"},children:[(0,i.jsxs)("h2",{className:"section-title",style:{marginBottom:0},children:[i.jsx(h.Z,{style:{width:"1.25rem",height:"1.25rem"}}),"Next Steps"]}),(0,i.jsxs)("button",{onClick:()=>B(e=>({...e,next_step_sections:!e.next_step_sections})),className:"add-section-btn",title:"Add a new section",children:[i.jsx(b.Z,{style:{width:"1rem",height:"1rem"}}),"Add Section"]})]}),R.next_step_sections&&(0,i.jsxs)("div",{className:"add-section-input",children:[i.jsx("input",{type:"text",className:"form-input",placeholder:"Enter section name (e.g., Raminder, John)",value:z.next_step_sections||"",onChange:e=>M(s=>({...s,next_step_sections:e.target.value})),onKeyPress:e=>"Enter"===e.key&&H("next_step_sections",z.next_step_sections||"")}),i.jsx("button",{onClick:()=>H("next_step_sections",z.next_step_sections||""),className:"add-btn",children:"Create"}),i.jsx("button",{onClick:()=>B(e=>({...e,next_step_sections:!1})),className:"cancel-section-btn",children:"Cancel"})]}),i.jsx("div",{className:"general-notes-label",children:"General Notes"}),o.next_steps.map((e,s)=>(0,i.jsxs)("div",{className:"discussion-item",children:[(0,i.jsxs)("div",{className:"discussion-number",children:["N",s+1]}),i.jsx("textarea",{className:"discussion-input",placeholder:"Enter next step...",value:e,onChange:e=>$("next_steps",s,e.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>T("next_steps",s),className:"control-btn add",children:i.jsx(f.Z,{style:{width:"1rem",height:"1rem"}})}),o.next_steps.length>1&&i.jsx("button",{onClick:()=>Y("next_steps",s),className:"control-btn",children:i.jsx(a.Z,{style:{width:"1rem",height:"1rem"}})})]})]},s)),o.next_step_sections&&o.next_step_sections.map(e=>(0,i.jsxs)("div",{className:"section-container",children:[(0,i.jsxs)("div",{className:"section-header",onClick:()=>O(e.id),children:[I[e.id]?i.jsx(N.Z,{style:{width:"1rem",height:"1rem"}}):i.jsx(v.Z,{style:{width:"1rem",height:"1rem"}}),i.jsx(u.Z,{style:{width:"1.25rem",height:"1.25rem"}}),i.jsx("span",{className:"section-name",children:e.name}),(0,i.jsxs)("span",{className:"section-count",children:["(",e.notes.filter(e=>e.trim()).length," notes)"]}),i.jsx("button",{onClick:s=>{s.stopPropagation(),K("next_step_sections",e.id)},className:"remove-section-btn",title:"Remove section",children:i.jsx(a.Z,{style:{width:"0.875rem",height:"0.875rem"}})})]}),I[e.id]&&i.jsx("div",{className:"section-notes",children:e.notes.map((s,t)=>(0,i.jsxs)("div",{className:"discussion-item section-note-item",children:[(0,i.jsxs)("div",{className:"discussion-number section-number",children:["N",t+1]}),i.jsx("textarea",{className:"discussion-input section-input",placeholder:`Enter ${e.name}'s next step...`,value:s,onChange:s=>J("next_step_sections",e.id,t,s.target.value)}),(0,i.jsxs)("div",{className:"discussion-controls",children:[i.jsx("button",{onClick:()=>G("next_step_sections",e.id,t),className:"control-btn add",children:i.jsx(f.Z,{style:{width:"1rem",height:"1rem"}})}),e.notes.length>1&&i.jsx("button",{onClick:()=>V("next_step_sections",e.id,t),className:"control-btn",children:i.jsx(a.Z,{style:{width:"1rem",height:"1rem"}})})]})]},t))})]},e.id))]})]}):i.jsx(()=>(0,i.jsxs)("div",{className:"document-view",children:[(0,i.jsxs)("div",{className:"document-header",children:[i.jsx("h1",{className:"document-title",children:"Meeting Notes"}),(0,i.jsxs)("div",{className:"document-meta",children:[(0,i.jsxs)("span",{className:"meta-item",children:[i.jsx("strong",{children:"Meeting:"})," ",o.title]}),(0,i.jsxs)("span",{className:"meta-item",children:[i.jsx("strong",{children:"Date:"})," ",(()=>{let[e,s,t]=o.date.split("-").map(Number),i=new Date(e,s-1,t);return i.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})})()]}),(0,i.jsxs)("span",{className:"meta-item",children:[i.jsx("strong",{children:"Time:"})," ",o.time]}),o.follow_up_date&&(0,i.jsxs)("span",{className:"meta-item",children:[i.jsx("strong",{children:"Follow-up Date:"})," ",(()=>{let[e,s,t]=o.follow_up_date.split("-").map(Number),i=new Date(e,s-1,t);return i.toLocaleDateString()})()]})]})]}),o.attendees.length>0&&(0,i.jsxs)("div",{className:"document-section",children:[i.jsx("h3",{className:"section-heading",children:"Attendees"}),i.jsx("div",{className:"attendees-grid",children:o.attendees.map((e,s)=>i.jsx("span",{className:"attendee-chip",children:e},s))})]}),(o.discussion_points.filter(e=>e.trim()).length>0||o.discussion_sections&&o.discussion_sections.length>0)&&(0,i.jsxs)("div",{className:"document-section",children:[i.jsx("h3",{className:"section-heading",children:"Key Discussion Points"}),o.discussion_points.filter(e=>e.trim()).length>0&&i.jsx("ol",{className:"discussion-list",children:o.discussion_points.filter(e=>e.trim()).map((e,s)=>i.jsx("li",{className:"discussion-item-doc",children:e},s))}),o.discussion_sections&&o.discussion_sections.map(e=>(0,i.jsxs)("div",{className:"sub-section",children:[(0,i.jsxs)("h4",{className:"sub-section-heading",children:[i.jsx(u.Z,{style:{width:"1rem",height:"1rem"}}),e.name]}),i.jsx("ol",{className:"discussion-list sub-list",children:e.notes.filter(e=>e.trim()).map((e,s)=>i.jsx("li",{className:"discussion-item-doc",children:e},s))})]},e.id))]}),(o.decisions_made.filter(e=>e.trim()).length>0||o.decision_sections&&o.decision_sections.length>0)&&(0,i.jsxs)("div",{className:"document-section",children:[i.jsx("h3",{className:"section-heading",children:"Decisions Made"}),o.decisions_made.filter(e=>e.trim()).length>0&&i.jsx("ul",{className:"decision-list",children:o.decisions_made.filter(e=>e.trim()).map((e,s)=>i.jsx("li",{className:"decision-item",children:e},s))}),o.decision_sections&&o.decision_sections.map(e=>(0,i.jsxs)("div",{className:"sub-section",children:[(0,i.jsxs)("h4",{className:"sub-section-heading",children:[i.jsx(u.Z,{style:{width:"1rem",height:"1rem"}}),e.name]}),i.jsx("ul",{className:"decision-list sub-list",children:e.notes.filter(e=>e.trim()).map((e,s)=>i.jsx("li",{className:"decision-item",children:e},s))})]},e.id))]}),(o.action_items.filter(e=>e.trim()).length>0||o.action_sections&&o.action_sections.length>0)&&(0,i.jsxs)("div",{className:"document-section",children:[i.jsx("h3",{className:"section-heading",children:"Action Items"}),o.action_items.filter(e=>e.trim()).length>0&&i.jsx("ul",{className:"action-list",children:o.action_items.filter(e=>e.trim()).map((e,s)=>(0,i.jsxs)("li",{className:"action-item",children:[(0,i.jsxs)("span",{className:"action-number",children:["A",s+1]}),e]},s))}),o.action_sections&&o.action_sections.map(e=>(0,i.jsxs)("div",{className:"sub-section",children:[(0,i.jsxs)("h4",{className:"sub-section-heading",children:[i.jsx(u.Z,{style:{width:"1rem",height:"1rem"}}),e.name]}),i.jsx("ul",{className:"action-list sub-list",children:e.notes.filter(e=>e.trim()).map((e,s)=>(0,i.jsxs)("li",{className:"action-item",children:[(0,i.jsxs)("span",{className:"action-number",children:["A",s+1]}),e]},s))})]},e.id))]}),(o.next_steps.filter(e=>e.trim()).length>0||o.next_step_sections&&o.next_step_sections.length>0)&&(0,i.jsxs)("div",{className:"document-section",children:[i.jsx("h3",{className:"section-heading",children:"Next Steps"}),o.next_steps.filter(e=>e.trim()).length>0&&i.jsx("ul",{className:"next-steps-list",children:o.next_steps.filter(e=>e.trim()).map((e,s)=>(0,i.jsxs)("li",{className:"next-step-item",children:[i.jsx("span",{className:"step-number",children:"→"}),e]},s))}),o.next_step_sections&&o.next_step_sections.map(e=>(0,i.jsxs)("div",{className:"sub-section",children:[(0,i.jsxs)("h4",{className:"sub-section-heading",children:[i.jsx(u.Z,{style:{width:"1rem",height:"1rem"}}),e.name]}),i.jsx("ul",{className:"next-steps-list sub-list",children:e.notes.filter(e=>e.trim()).map((e,s)=>(0,i.jsxs)("li",{className:"next-step-item",children:[i.jsx("span",{className:"step-number",children:"→"}),e]},s))})]},e.id))]}),i.jsx("div",{className:"document-footer",children:(0,i.jsxs)("button",{onClick:X,className:"edit-btn",children:[i.jsx(h.Z,{style:{width:"1rem",height:"1rem"}}),"Edit Notes"]})})]}),{})}),E&&(0,i.jsxs)("div",{className:"save-section",children:[(0,i.jsxs)("button",{onClick:Q,className:"save-btn",disabled:F,children:[i.jsx(h.Z,{style:{width:"1.25rem",height:"1.25rem"}}),F?"Saving...":"Save Meeting Notes"]}),i.jsx("button",{onClick:()=>{l?(r(l),S(!1)):s()},className:"cancel-btn",children:"Cancel"})]})]})]})}function D({meeting:e,onClose:s,onUpdate:u,onDelete:f,onFollowUp:b,projectMembers:j=[],projects:N=[],onProjectChange:v}){let[y,_]=(0,n.useState)(!1),[w,D]=(0,n.useState)(!1),[k,C]=(0,n.useState)({title:e.title,description:e.description,date:e.date,time:e.time,duration:e.duration,project_id:e.project_id||0,attendees:e.attendees||"",attendee_ids:e.attendee_ids||[]});(0,n.useEffect)(()=>{y&&k.project_id&&v&&v(k.project_id)},[k.project_id,y,v]);let A=async()=>{try{await u({...k,project:k.project_id,attendee_ids:k.attendee_ids}),_(!1)}catch(e){console.error("Failed to update meeting:",e)}},Z=async()=>{if(window.confirm("Are you sure you want to delete this meeting?"))try{await f(e.id),s()}catch(e){console.error("Failed to delete meeting:",e)}},[E,S]=(0,n.useState)([]),[z,M]=(0,n.useState)([]);return(0,n.useEffect)(()=>{let e=async()=>{try{let{userService:e}=await Promise.resolve().then(t.bind(t,44937)),s=await e.getUsers();M(s||[])}catch(e){console.error("Failed to fetch users:",e),M([])}};e()},[]),(0,n.useEffect)(()=>{if(e.attendee_ids&&e.attendee_ids.length>0&&z.length>0){let s=e.attendee_ids.map(e=>{let s=z.find(s=>s.id===e);if(s)return s.name||s.email?.split("@")[0]||"Unknown User";let t=j.find(s=>s.id===e);return t?t.name:`User ${e}`});S(s)}else e.attendees_list&&e.attendees_list.length>0?S(e.attendees_list):e.attendees&&"string"==typeof e.attendees?S(e.attendees.split(",").map(e=>e.trim()).filter(e=>e)):S([])},[e.attendee_ids,e.attendees_list,e.attendees,j,z]),(0,i.jsxs)("div",{className:"modal-overlay",onClick:s,children:[i.jsx("style",{dangerouslySetInnerHTML:{__html:`
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
            border: 1px solid #2D2D2D !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
            max-width: 450px !important;
            background: #1A1A1A !important;
          }
          .modal-content {
            padding: 0;
            border: none !important;
            box-shadow: none !important;
          }
          .modal-header {
            padding: 1rem;
            border-bottom: 2px solid #2D2D2D;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            background: #141414;
          }
          .modal-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #FFFFFF;
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
            border: 2px solid #3D3D3D;
            border-radius: 6px;
            background: #141414;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #E4E4E7;
          }
          .action-btn:hover {
            border-color: #FFFFFF;
            transform: translateY(-1px);
          }
          .action-btn.edit { background: #2D2D2D; }
          .action-btn.save { background: #000000; color: #ffffff; }
          .action-btn.delete { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
          .action-btn.close { background: #FFFFFF; border: 2px solid #FFFFFF; color: #1A1A1A; box-shadow: 0 2px 8px rgba(255,255,255,0.3); }
          .action-btn.close:hover { background: #1F1F1F; color: #EF4444; transform: translateY(-2px) scale(1.05); box-shadow: 0 4px 12px rgba(255,255,255,0.4); }
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
            background: #141414;
            border: 1px solid #2D2D2D;
            border-radius: 8px;
          }
          .info-icon {
            color: #71717A;
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
        `}}),(0,i.jsxs)("div",{className:"meeting-modal meeting-modal-fixed",onClick:e=>e.stopPropagation(),children:[(0,i.jsxs)("div",{className:"modal-header",children:[i.jsx("h2",{className:"modal-title",children:y?"Edit Meeting":e.title}),(0,i.jsxs)("div",{className:"modal-actions",children:[y?i.jsx("button",{onClick:A,className:"action-btn save",title:"Save changes",children:i.jsx(l.Z,{style:{width:"16px",height:"16px"}})}):(0,i.jsxs)(i.Fragment,{children:[b&&(0,i.jsxs)("button",{onClick:()=>{s(),b(e)},className:"action-btn",title:"Schedule follow-up meeting",style:{background:"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",color:"#fff",display:"flex",alignItems:"center",gap:"4px",padding:"6px 12px",borderRadius:"6px",fontSize:"12px",fontWeight:"600"},children:[i.jsx(o.Z,{style:{width:"14px",height:"14px"}}),"Follow-up"]}),i.jsx("button",{onClick:()=>_(!0),className:"action-btn edit",title:"Edit meeting",children:i.jsx(r.Z,{style:{width:"16px",height:"16px"}})}),i.jsx("button",{onClick:Z,className:"action-btn delete",title:"Delete meeting",children:i.jsx(a.Z,{style:{width:"16px",height:"16px"}})})]}),i.jsx("button",{onClick:s,className:"action-btn close",title:"Close",children:i.jsx(d.Z,{style:{width:"16px",height:"16px"}})})]})]}),i.jsx("div",{className:"modal-content",children:(0,i.jsxs)("div",{className:"modal-body",children:[y?(0,i.jsxs)("div",{className:"edit-form",children:[(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Meeting Title *"}),i.jsx("input",{type:"text",required:!0,className:"form-input",placeholder:"Enter meeting title...",value:k.title,onChange:e=>C({...k,title:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Description"}),i.jsx("textarea",{className:"form-textarea",placeholder:"What will be discussed in this meeting?",value:k.description,onChange:e=>C({...k,description:e.target.value}),style:{minHeight:"80px",resize:"vertical"}})]}),N.length>0&&(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Project *"}),(0,i.jsxs)("select",{required:!0,className:"form-select",value:k.project_id,onChange:e=>C({...k,project_id:Number(e.target.value),attendee_ids:[]}),children:[i.jsx("option",{value:0,children:"Select a project"}),N.map(e=>i.jsx("option",{value:e.id,children:e.name},e.id))]})]}),(0,i.jsxs)("div",{className:"form-grid-3",children:[(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Date *"}),i.jsx("input",{type:"date",required:!0,className:"form-input",value:k.date,onChange:e=>C({...k,date:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Time *"}),i.jsx("input",{type:"time",required:!0,className:"form-input",value:k.time,onChange:e=>C({...k,time:e.target.value})})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Duration"}),i.jsx("input",{type:"number",min:"15",max:"480",step:"15",className:"form-input",placeholder:"Minutes",value:k.duration,onChange:e=>C({...k,duration:Number(e.target.value)})})]})]}),(0,i.jsxs)("div",{className:"form-group",children:[i.jsx("label",{className:"form-label",children:"Invite Attendees (Optional)"}),k.attendee_ids.length>0&&i.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.5rem",marginBottom:"0.75rem",padding:"0.75rem",backgroundColor:"#141414",border:"1px solid #2D2D2D",borderRadius:"6px"},children:k.attendee_ids.map(e=>{let s=j.find(s=>s.id===e);return s?(0,i.jsxs)("span",{style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.25rem 0.75rem",backgroundColor:"#000000",color:"#ffffff",borderRadius:"20px",fontSize:"0.875rem"},children:[s.name,i.jsx("button",{type:"button",onClick:()=>C(s=>({...s,attendee_ids:s.attendee_ids.filter(s=>s!==e)})),style:{background:"none",border:"none",color:"#ffffff",cursor:"pointer",fontSize:"1rem",lineHeight:"1"},children:"\xd7"})]},e):null})}),j.length>0?i.jsx("div",{style:{border:"2px solid #3D3D3D",borderRadius:"6px",maxHeight:"200px",overflowY:"auto"},children:j.map(e=>{let s=k.attendee_ids.includes(e.id);return(0,i.jsxs)("div",{onClick:()=>{C(t=>({...t,attendee_ids:s?t.attendee_ids.filter(s=>s!==e.id):[...t.attendee_ids,e.id]}))},style:{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",borderBottom:"1px solid #2D2D2D",cursor:"pointer",backgroundColor:s?"rgba(59, 130, 246, 0.2)":"#141414",borderLeft:s?"4px solid #3B82F6":"4px solid transparent"},children:[i.jsx("input",{type:"checkbox",checked:s,onChange:()=>{},style:{cursor:"pointer"}}),(0,i.jsxs)("div",{style:{flex:1},children:[i.jsx("div",{style:{fontWeight:"500",color:"#FFFFFF"},children:e.name}),i.jsx("div",{style:{fontSize:"0.875rem",color:"#71717A"},children:e.email})]})]},e.id)})}):i.jsx("div",{style:{padding:"2rem",textAlign:"center",color:"#71717A",border:"2px dashed #3D3D3D",borderRadius:"6px"},children:k.project_id?"Loading project members...":"Select a project to see available members"})]}),(0,i.jsxs)("div",{className:"form-actions",children:[i.jsx("button",{onClick:A,className:"btn btn-primary",children:"Update Meeting"}),i.jsx("button",{onClick:()=>_(!1),className:"btn btn-secondary",children:"Cancel"})]})]}):(0,i.jsxs)("div",{className:"meeting-info",children:[(0,i.jsxs)("div",{className:"info-row",children:[i.jsx(c.Z,{className:"info-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Date"}),i.jsx("div",{className:"info-value",children:(e=>{let[s,t,i]=e.split("-").map(Number),n=new Date(s,t-1,i);return n.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})})(e.date)})]})]}),(0,i.jsxs)("div",{className:"info-row",children:[i.jsx(m.Z,{className:"info-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Time & Duration"}),(0,i.jsxs)("div",{className:"info-value",children:[(e=>{let[s,t]=e.split(":"),i=new Date;return i.setHours(parseInt(s),parseInt(t)),i.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0})})(e.time)," • ",(e=>{let s=Math.floor(e/60),t=e%60;return s>0?t>0?`${s}h ${t}m`:`${s}h`:`${t}m`})(e.duration)]})]})]}),(0,i.jsxs)("div",{className:"info-row",children:[i.jsx(h.Z,{className:"info-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Project"}),i.jsx("div",{className:"info-value",children:e.project_name})]})]}),e.description&&(0,i.jsxs)("div",{className:"info-row",children:[i.jsx(p.Z,{className:"info-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Description"}),i.jsx("div",{className:"info-value",children:e.description})]})]}),E.length>0&&(0,i.jsxs)("div",{className:"info-row",children:[i.jsx(x.Z,{className:"info-icon",style:{width:"20px",height:"20px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Attendees"}),i.jsx("div",{className:"attendees-list",children:E.map((e,s)=>i.jsx("span",{className:"attendee-tag",children:e},s))})]})]}),e.agenda_items&&e.agenda_items.length>0&&(0,i.jsxs)("div",{className:"info-row",style:{alignItems:"flex-start"},children:[i.jsx(g.Z,{className:"info-icon",style:{width:"20px",height:"20px",marginTop:"2px"}}),(0,i.jsxs)("div",{className:"info-content",children:[i.jsx("div",{className:"info-label",children:"Meeting Agenda"}),i.jsx("div",{style:{marginTop:"8px",background:"#141414",borderRadius:"8px",overflow:"hidden",border:"1px solid #2D2D2D"},children:e.agenda_items.map((s,t)=>(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"12px",padding:"10px 12px",borderBottom:t<e.agenda_items.length-1?"1px solid #2D2D2D":"none",background:"#1A1A1A"},children:[i.jsx("span",{style:{width:"22px",height:"22px",borderRadius:"50%",background:"#5884FD",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"700",flexShrink:0},children:t+1}),i.jsx("span",{style:{fontSize:"13px",color:"#E4E4E7"},children:s})]},t))})]})]})]}),(0,i.jsxs)("div",{style:{display:"flex",gap:"12px",flexWrap:"wrap",padding:"16px 0",borderTop:"1px solid #2D2D2D",marginTop:"16px"},children:[b&&(0,i.jsxs)("button",{onClick:()=>{s(),b(e)},style:{display:"flex",alignItems:"center",gap:"8px",padding:"12px 20px",background:"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",color:"#fff",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",transition:"all 0.2s ease",boxShadow:"0 2px 8px rgba(59, 130, 246, 0.3)"},children:[i.jsx(o.Z,{style:{width:"18px",height:"18px"}}),"Schedule Follow-up Meeting"]}),(0,i.jsxs)("button",{onClick:()=>D(!0),style:{display:"flex",alignItems:"center",gap:"8px",padding:"12px 20px",background:"#2D2D2D",color:"#E4E4E7",border:"1px solid #3D3D3D",borderRadius:"8px",fontSize:"14px",fontWeight:"600",cursor:"pointer",transition:"all 0.2s ease"},children:[i.jsx(g.Z,{style:{width:"18px",height:"18px"}}),"Meeting Notes"]})]})]})})]}),w&&i.jsx(F,{meeting:{id:e.id,title:e.title,date:e.date,time:e.time,duration:e.duration,attendees_list:E},onClose:()=>D(!1),projectMembers:j})]})}}};