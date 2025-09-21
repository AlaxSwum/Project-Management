(()=>{var e={};e.id=4310,e.ids=[4310],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},5403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},4749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},4300:e=>{"use strict";e.exports=require("buffer")},6113:e=>{"use strict";e.exports=require("crypto")},2361:e=>{"use strict";e.exports=require("events")},3685:e=>{"use strict";e.exports=require("http")},5687:e=>{"use strict";e.exports=require("https")},1808:e=>{"use strict";e.exports=require("net")},1017:e=>{"use strict";e.exports=require("path")},5477:e=>{"use strict";e.exports=require("punycode")},2781:e=>{"use strict";e.exports=require("stream")},4404:e=>{"use strict";e.exports=require("tls")},7310:e=>{"use strict";e.exports=require("url")},9796:e=>{"use strict";e.exports=require("zlib")},8199:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>o.a,__next_app__:()=>p,originalPathname:()=>E,pages:()=>c,routeModule:()=>m,tree:()=>l});var r=s(7096),a=s(6132),i=s(7284),o=s.n(i),d=s(2564),n={};for(let e in d)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(n[e]=()=>d[e]);s.d(t,n);let l=["",{children:["admin",{children:["db-setup",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,4610)),"/Users/swumpyaesone/Documents/project_management/frontend/src/app/admin/db-setup/page.tsx"]}]},{}]},{metadata:{icon:[async e=>(await Promise.resolve().then(s.bind(s,3881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(s.bind(s,2540)),"/Users/swumpyaesone/Documents/project_management/frontend/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,9291,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(s.bind(s,3881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],c=["/Users/swumpyaesone/Documents/project_management/frontend/src/app/admin/db-setup/page.tsx"],E="/admin/db-setup/page",p={require:s,loadChunk:()=>Promise.resolve()},m=new r.AppPageRouteModule({definition:{kind:a.x.APP_PAGE,page:"/admin/db-setup/page",pathname:"/admin/db-setup",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},5629:(e,t,s)=>{Promise.resolve().then(s.bind(s,5331))},5331:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>o});var r=s(3854),a=s(4218),i=s(2132);function o(){let[e,t]=(0,a.useState)(""),[s,o]=(0,a.useState)(!1),[d,n]=(0,a.useState)([]),[l,c]=(0,a.useState)(!1),[E,p]=(0,a.useState)(""),m=async()=>{o(!0),t("Creating meeting_notes table...");try{let{error:e}=await i.supabase.rpc("sql",{query:`
          CREATE TABLE IF NOT EXISTS meeting_notes (
              id BIGSERIAL PRIMARY KEY,
              meeting_id BIGINT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
              title TEXT NOT NULL,
              date DATE NOT NULL,
              time TIME NOT NULL,
              attendees TEXT[] DEFAULT '{}',
              discussion_points TEXT[] DEFAULT '{}',
              decisions_made TEXT[] DEFAULT '{}',
              action_items TEXT[] DEFAULT '{}',
              next_steps TEXT[] DEFAULT '{}',
              follow_up_date DATE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `});if(e){console.error("Error creating table:",e);let{error:s}=await i.supabase.from("meeting_notes").select("id").limit(1);if(s&&"42P01"===s.code){t("❌ Table creation failed. Please create the table manually in Supabase dashboard."),o(!1);return}if(!s){t("✅ Table already exists!"),o(!1);return}}await i.supabase.rpc("sql",{query:`
          CREATE INDEX IF NOT EXISTS idx_meeting_notes_meeting_id ON meeting_notes(meeting_id);
          CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_notes_unique_meeting 
          ON meeting_notes(meeting_id);
        `}),await i.supabase.rpc("sql",{query:"ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;"});let s=[`
        CREATE POLICY "Users can view meeting notes for accessible meetings" ON meeting_notes
        FOR SELECT USING (
            meeting_id IN (
                SELECT m.id 
                FROM meetings m
                JOIN projects p ON p.id = m.project
                WHERE p.created_by = auth.uid()
                OR p.id IN (
                    SELECT project_id 
                    FROM tasks 
                    WHERE assignee = auth.uid() OR created_by = auth.uid()
                )
            )
        );
        `,`
        CREATE POLICY "Users can create meeting notes for accessible meetings" ON meeting_notes
        FOR INSERT WITH CHECK (
            meeting_id IN (
                SELECT m.id 
                FROM meetings m
                JOIN projects p ON p.id = m.project
                WHERE p.created_by = auth.uid()
                OR p.id IN (
                    SELECT project_id 
                    FROM tasks 
                    WHERE assignee = auth.uid() OR created_by = auth.uid()
                )
            )
        );
        `,`
        CREATE POLICY "Users can update meeting notes for accessible meetings" ON meeting_notes
        FOR UPDATE USING (
            meeting_id IN (
                SELECT m.id 
                FROM meetings m
                JOIN projects p ON p.id = m.project
                WHERE p.created_by = auth.uid()
                OR p.id IN (
                    SELECT project_id 
                    FROM tasks 
                    WHERE assignee = auth.uid() OR created_by = auth.uid()
                )
            )
        );
        `,`
        CREATE POLICY "Users can delete meeting notes for accessible meetings" ON meeting_notes
        FOR DELETE USING (
            meeting_id IN (
                SELECT m.id 
                FROM meetings m
                JOIN projects p ON p.id = m.project
                WHERE p.created_by = auth.uid()
                OR p.id IN (
                    SELECT project_id 
                    FROM tasks 
                    WHERE assignee = auth.uid() OR created_by = auth.uid()
                )
            )
        );
        `];for(let e of s)await i.supabase.rpc("sql",{query:e});t("✅ Meeting notes table created successfully with all policies!")}catch(e){console.error("Setup error:",e),t(`❌ Error: ${e instanceof Error?e.message:"Unknown error"}`)}o(!1)},u=async()=>{c(!0),p("");try{let{data:e,error:t}=await i.supabase.rpc("list_public_tables");if(t)throw t;n(e||[])}catch(e){console.error("Fetch tables error:",e),n([]),p("Could not fetch tables. Please run add_list_public_tables_function.sql in Supabase SQL editor.")}finally{c(!1)}},T=async()=>{o(!0),t("Creating todo_items table...");try{let{error:e}=await i.supabase.rpc("sql",{query:`
          CREATE TABLE IF NOT EXISTS todo_items (
              id SERIAL PRIMARY KEY,
              project_id INTEGER NOT NULL REFERENCES projects_project(id) ON DELETE CASCADE,
              title TEXT NOT NULL,
              description TEXT,
              completed BOOLEAN DEFAULT FALSE,
              due_date DATE,
              created_by INTEGER NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `});if(e){console.error("Error creating todo table:",e);let{error:s}=await i.supabase.from("todo_items").select("id").limit(1);if(s&&"42P01"===s.code){t("❌ Todo table creation failed. Please create the table manually in Supabase dashboard."),o(!1);return}if(!s){t("✅ Todo table already exists!"),o(!1);return}}await i.supabase.rpc("sql",{query:`
          CREATE INDEX IF NOT EXISTS idx_todo_items_project_id ON todo_items(project_id);
          CREATE INDEX IF NOT EXISTS idx_todo_items_created_by ON todo_items(created_by);
          CREATE INDEX IF NOT EXISTS idx_todo_items_due_date ON todo_items(due_date);
          CREATE INDEX IF NOT EXISTS idx_todo_items_completed ON todo_items(completed);
        `}),await i.supabase.rpc("sql",{query:"ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;"});let s=[`
        CREATE POLICY "Users can view todos for accessible projects" ON todo_items
        FOR SELECT USING (
            project_id IN (
                SELECT DISTINCT p.id 
                FROM projects_project p
                LEFT JOIN projects_project_members pm ON p.id = pm.project_id
                WHERE p.created_by_id = auth.uid()::INTEGER 
                   OR pm.user_id = auth.uid()::INTEGER
            )
        );
        `,`
        CREATE POLICY "Users can create todos for accessible projects" ON todo_items
        FOR INSERT WITH CHECK (
            created_by = auth.uid()::INTEGER AND
            project_id IN (
                SELECT DISTINCT p.id 
                FROM projects_project p
                LEFT JOIN projects_project_members pm ON p.id = pm.project_id
                WHERE p.created_by_id = auth.uid()::INTEGER 
                   OR pm.user_id = auth.uid()::INTEGER
            )
        );
        `,`
        CREATE POLICY "Users can update their own todos" ON todo_items
        FOR UPDATE USING (created_by = auth.uid()::INTEGER);
        `,`
        CREATE POLICY "Users can delete their own todos" ON todo_items
        FOR DELETE USING (created_by = auth.uid()::INTEGER);
        `];for(let e of s)await i.supabase.rpc("sql",{query:e});t("✅ Todo items table created successfully with all policies!")}catch(e){console.error("Todo setup error:",e),t(`❌ Error: ${e instanceof Error?e.message:"Unknown error"}`)}o(!1)},b=async()=>{o(!0),t("Testing database connection...");try{let{data:e,error:s}=await i.supabase.from("meeting_notes").select("count(*)").limit(1);s?"42P01"===s.code?t('⚠️ Table does not exist. Click "Create Table" to set it up.'):t(`❌ Connection error: ${s.message}`):t("✅ Connection successful! Table exists and is accessible.")}catch(e){t(`❌ Test failed: ${e instanceof Error?e.message:"Unknown error"}`)}o(!1)},N=async()=>{o(!0),t("Testing todo_items table connection...");try{let{data:e,error:s}=await i.supabase.from("todo_items").select("count(*)").limit(1);s?"42P01"===s.code?t('⚠️ Todo table does not exist. Click "Create Todo Table" to set it up.'):t(`❌ Todo table error: ${s.message}`):t("✅ Todo table connection successful! Table exists and is accessible.")}catch(e){t(`❌ Todo test failed: ${e instanceof Error?e.message:"Unknown error"}`)}o(!1)};return r.jsx("div",{className:"min-h-screen bg-gray-50 py-8",children:r.jsx("div",{className:"max-w-4xl mx-auto px-4",children:(0,r.jsxs)("div",{className:"bg-white shadow-lg rounded-lg overflow-hidden",children:[(0,r.jsxs)("div",{className:"bg-gray-800 text-white p-6",children:[r.jsx("h1",{className:"text-2xl font-bold",children:"Database Setup"}),r.jsx("p",{className:"text-gray-300 mt-2",children:"Set up and test database tables for the project management system"})]}),r.jsx("div",{className:"p-6",children:(0,r.jsxs)("div",{className:"space-y-6",children:[(0,r.jsxs)("div",{className:"border border-gray-200 rounded-lg p-4",children:[r.jsx("h2",{className:"text-lg font-semibold text-gray-900 mb-4",children:"Supabase Tables"}),r.jsx("div",{className:"flex flex-wrap gap-4 mb-4",children:r.jsx("button",{onClick:u,disabled:l,className:"px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed",children:l?"Fetching...":"Fetch Tables"})}),E&&r.jsx("div",{className:"p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200 mb-3",children:E}),d.length>0&&r.jsx("div",{className:"overflow-x-auto",children:(0,r.jsxs)("table",{className:"min-w-full divide-y divide-gray-200",children:[r.jsx("thead",{className:"bg-gray-50",children:(0,r.jsxs)("tr",{children:[r.jsx("th",{className:"px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Table"}),r.jsx("th",{className:"px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Schema"}),r.jsx("th",{className:"px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Type"})]})}),r.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:d.map(e=>(0,r.jsxs)("tr",{children:[r.jsx("td",{className:"px-4 py-2 text-sm text-gray-900",children:e.table_name}),r.jsx("td",{className:"px-4 py-2 text-sm text-gray-500",children:e.table_schema}),r.jsx("td",{className:"px-4 py-2 text-sm text-gray-500",children:e.table_type})]},`${e.table_schema}.${e.table_name}`))})]})})]}),(0,r.jsxs)("div",{className:"border border-gray-200 rounded-lg p-4",children:[r.jsx("h2",{className:"text-lg font-semibold text-gray-900 mb-4",children:"Meeting Notes Table"}),(0,r.jsxs)("div",{className:"flex flex-wrap gap-4 mb-4",children:[r.jsx("button",{onClick:m,disabled:s,className:"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",children:s?"Creating...":"Create Meeting Notes Table"}),r.jsx("button",{onClick:b,disabled:s,className:"px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed",children:s?"Testing...":"Test Connection"})]})]}),(0,r.jsxs)("div",{className:"border border-gray-200 rounded-lg p-4",children:[r.jsx("h2",{className:"text-lg font-semibold text-gray-900 mb-4",children:"Todo Items Table"}),(0,r.jsxs)("div",{className:"flex flex-wrap gap-4 mb-4",children:[r.jsx("button",{onClick:T,disabled:s,className:"px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed",children:s?"Creating...":"Create Todo Items Table"}),r.jsx("button",{onClick:N,disabled:s,className:"px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed",children:s?"Testing...":"Test Todo Table"})]})]}),e&&r.jsx("div",{className:`p-4 rounded-lg ${e.includes("✅")?"bg-green-50 border border-green-200":e.includes("❌")?"bg-red-50 border border-red-200":e.includes("⚠️")?"bg-yellow-50 border border-yellow-200":"bg-blue-50 border border-blue-200"}`,children:r.jsx("p",{className:`font-medium ${e.includes("✅")?"text-green-800":e.includes("❌")?"text-red-800":e.includes("⚠️")?"text-yellow-800":"text-blue-800"}`,children:e})}),(0,r.jsxs)("div",{className:"bg-yellow-50 border border-yellow-200 rounded-lg p-4",children:[r.jsx("h3",{className:"text-lg font-semibold text-yellow-900 mb-2",children:"Manual Setup Instructions"}),r.jsx("p",{className:"text-yellow-700 mb-2",children:"If automatic setup doesn't work, you can manually create tables in Supabase:"}),(0,r.jsxs)("ol",{className:"list-decimal list-inside text-yellow-700 text-sm space-y-1",children:[r.jsx("li",{children:"Go to your Supabase dashboard"}),r.jsx("li",{children:"Navigate to SQL Editor"}),r.jsx("li",{children:"Run the SQL commands below"}),r.jsx("li",{children:"Refresh this page and test the connection"})]})]}),(0,r.jsxs)("div",{className:"bg-gray-50 border border-gray-200 rounded-lg p-4",children:[r.jsx("h3",{className:"text-lg font-semibold text-gray-900 mb-2",children:"Meeting Notes SQL Commands"}),r.jsx("pre",{className:"text-xs bg-white p-3 rounded border overflow-x-auto",children:`-- Create meeting_notes table
CREATE TABLE IF NOT EXISTS meeting_notes (
    id BIGSERIAL PRIMARY KEY,
    meeting_id BIGINT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    attendees TEXT[] DEFAULT '{}',
    discussion_points TEXT[] DEFAULT '{}',
    decisions_made TEXT[] DEFAULT '{}',
    action_items TEXT[] DEFAULT '{}',
    next_steps TEXT[] DEFAULT '{}',
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_meeting_notes_meeting_id ON meeting_notes(meeting_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_notes_unique_meeting ON meeting_notes(meeting_id);

-- Enable RLS
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;`})]}),(0,r.jsxs)("div",{className:"bg-gray-50 border border-gray-200 rounded-lg p-4",children:[r.jsx("h3",{className:"text-lg font-semibold text-gray-900 mb-2",children:"Todo Items SQL Commands (Simplified)"}),r.jsx("pre",{className:"text-xs bg-white p-3 rounded border overflow-x-auto",children:`-- Create todo_items table (simplified: title, description, due_date only)
CREATE TABLE IF NOT EXISTS todo_items (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects_project(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    due_date DATE,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_todo_items_project_id ON todo_items(project_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_created_by ON todo_items(created_by);
CREATE INDEX IF NOT EXISTS idx_todo_items_due_date ON todo_items(due_date);
CREATE INDEX IF NOT EXISTS idx_todo_items_completed ON todo_items(completed);

-- Enable RLS
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;`})]})]})})]})})})}},4610:(e,t,s)=>{"use strict";s.r(t),s.d(t,{$$typeof:()=>o,__esModule:()=>i,default:()=>n});var r=s(5153);let a=(0,r.createProxy)(String.raw`/Users/swumpyaesone/Documents/project_management/frontend/src/app/admin/db-setup/page.tsx`),{__esModule:i,$$typeof:o}=a,d=a.default,n=d},3881:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>a});var r=s(8531);let a=e=>{let t=(0,r.fillMetadataSegment)(".",e.params,"favicon.ico");return[{type:"image/x-icon",sizes:"16x16",url:t+""}]}}};var t=require("../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[3271,1816,1323,8297],()=>s(8199));module.exports=r})();