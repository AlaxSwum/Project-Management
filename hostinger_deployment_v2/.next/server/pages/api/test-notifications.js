"use strict";(()=>{var e={};e.id=7746,e.ids=[7746],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,n){return n in t?t[n]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,n)):"function"==typeof t&&"default"===n?t:void 0}}})},7114:(e,t,n)=>{n.r(t),n.d(t,{config:()=>m,default:()=>c,routeModule:()=>p});var s={};n.r(s),n.d(s,{default:()=>d});var a=n(1802),r=n(7153),i=n(6249);class o{constructor(){this.apiUrl="https://api.sendinblue.com/v3",this.apiKey=process.env.BREVO_API_KEY||""}async sendEmail(e){if(!this.apiKey)return console.error("Brevo API key not configured"),{success:!1,error:"API key not configured"};try{let t=await fetch(`${this.apiUrl}/smtp/email`,{method:"POST",headers:{"Content-Type":"application/json","api-key":this.apiKey},body:JSON.stringify({sender:e.sender||{name:"Project Management System",email:"noreply@projectmanagement.com"},to:e.to.map(e=>({email:e})),subject:e.subject,htmlContent:e.htmlContent,textContent:e.textContent||this.stripHtml(e.htmlContent)})}),n=await t.json();if(!t.ok)return console.error("Brevo API error:",n),{success:!1,error:n};return{success:!0,data:n}}catch(e){return console.error("Error sending email via Brevo:",e),{success:!1,error:e}}}async sendTaskReminderEmail(e,t,n){let s=this.generateTaskReminderHTML(t,n);return await this.sendEmail({to:[e],subject:`Task Reminders - ${n.length} pending task${n.length>1?"s":""}`,htmlContent:s})}async sendProjectInviteEmail(e,t,n,s){let a=this.generateProjectInviteHTML(t,n,s);return await this.sendEmail({to:[e],subject:`Project Invitation: ${n}`,htmlContent:a})}async sendTaskAssignmentEmail(e,t,n,s,a){let r=this.generateTaskAssignmentHTML(t,n,s,a);return await this.sendEmail({to:[e],subject:`New Task Assignment: ${n}`,htmlContent:r})}generateTaskReminderHTML(e,t){let n=t.map(e=>`
      <li style="margin-bottom: 10px; padding: 10px; border-left: 3px solid #3B82F6; background-color: #F8FAFC;">
        <strong>${e.title}</strong><br>
        <small>Due: ${e.due_date?new Date(e.due_date).toLocaleDateString():"No due date"}</small><br>
        <small>Project: ${e.project_name||"Unknown"}</small>
      </li>
    `).join("");return`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Task Reminders</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3B82F6;">Task Reminders</h2>
            <p>Hi ${e},</p>
            <p>You have ${t.length} pending task${t.length>1?"s":""} that need your attention:</p>
            <ul style="list-style: none; padding: 0;">
              ${n}
            </ul>
            <p>Please log in to your project management system to update these tasks.</p>
            <p>Best regards,<br>Project Management Team</p>
          </div>
        </body>
      </html>
    `}generateProjectInviteHTML(e,t,n){return`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Project Invitation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3B82F6;">Project Invitation</h2>
            <p>Hi ${e},</p>
            <p>You have been invited to join the project: <strong>${t}</strong></p>
            <p>Click the link below to accept the invitation and start collaborating:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${n}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
            </p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #F3F4F6; padding: 10px; border-radius: 5px;">${n}</p>
            <p>Best regards,<br>Project Management Team</p>
          </div>
        </body>
      </html>
    `}generateTaskAssignmentHTML(e,t,n,s){return`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Task Assignment</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3B82F6;">New Task Assignment</h2>
            <p>Hi ${e},</p>
            <p>You have been assigned a new task in project <strong>${s}</strong>:</p>
            <div style="background-color: #F8FAFC; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #1F2937; margin-top: 0;">${t}</h3>
              <p style="margin-bottom: 0;">${n}</p>
            </div>
            <p>Please log in to your project management system to view the full details and start working on this task.</p>
            <p>Best regards,<br>Project Management Team</p>
          </div>
        </body>
      </html>
    `}stripHtml(e){return e.replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim()}}let l=new o;async function d(e,t){if("POST"!==e.method)return t.status(405).json({error:"Method not allowed"});let{email:n,testType:s="basic"}=e.body;if(!n)return t.status(400).json({error:"Email is required"});try{let e;switch(s){case"basic":e=await l.sendEmail({to:[n],subject:"Test Email from Project Management System",htmlContent:"<h1>Test Email</h1><p>Hello Test User, this is a test email from your project management system.</p>",sender:{name:"Project Management System",email:"noreply@projectmanagement.com"}});break;case"task-assignment":e=await l.sendTaskAssignmentEmail(n,"Test User","Test Task Assignment","This is a test task to verify the notification system is working correctly.","Test Project");break;case"task-reminder":e=await l.sendTaskReminderEmail(n,"Test User",[{title:"Test Task Reminder",due_date:new Date(Date.now()+864e5).toISOString(),project_name:"Test Project"}]);break;case"account-info":e={success:!0,message:"Brevo service is configured"};break;default:return t.status(400).json({error:"Invalid test type"})}return t.status(200).json({success:!0,message:`${s} test completed successfully`,result:e,timestamp:new Date().toISOString()})}catch(e){return console.error("Test notification failed:",e),t.status(500).json({success:!1,error:"Test notification failed",details:e instanceof Error?e.message:"Unknown error",timestamp:new Date().toISOString()})}}let c=(0,i.l)(s,"default"),m=(0,i.l)(s,"config"),p=new a.PagesAPIRouteModule({definition:{kind:r.x.PAGES_API,page:"/api/test-notifications",pathname:"/api/test-notifications",bundlePath:"",filename:""},userland:s})},7153:(e,t)=>{var n;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return n}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(n||(n={}))},1802:(e,t,n)=>{e.exports=n(145)}};var t=require("../../webpack-api-runtime.js");t.C(e);var n=t(t.s=7114);module.exports=n})();