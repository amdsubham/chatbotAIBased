# Universal AI Support Chatbot System
        
1. Core Component Overview
The chatbot appears on the bottom-right corner of the screen, fixed position, floating-style widget, and can be embedded in any dashboard or page.

2. Triggering and Invocation
The chatbot can be called whenever an exception occurs or manually by user action, and opens a modal dialog with details about the issue, including a hardcoded first message, followed by a question to debug with the AI Chat Agent.

3. Chatbot Interaction & Behavior
The chat interface is fully embedded inside the modal, supports continuous chat between user and AI assistant, and messages are preserved within the same modal session, user can ask follow-up questions, upload images/screenshots for debugging, and each query remains threaded per error instance, AI auto-takes the exception/error message, finds a possible fix or solution automatically, and handles multiple error contexts sequentially.

4. AI Assistance & Escalation
AI first provides a solution suggestion, if not satisfactory, asks if the user wants to chat with a human agent, and transfers the chat to the live admin interface if available, or shows a message if not available, and creates a ticket/email alert for admin follow-up if chat is unresolved.

5. Admin Panel
Shows list of active and past user chats, identified via email ID, timestamp, and error context, admin can view all previous conversations, chat live if user is online, manually assign responses, add or update Question–Answer pairs for chatbot training, mark queries as resolved/unresolved, and view image uploads from users, system suggests possible answers based on last user query and previously saved Q&A patterns.

6. Knowledge Base
Admin can enter Question and Answer, system learns from admin-provided data, and AI auto-suggests relevant responses based on user’s latest question.

7. User Identification & Data Handling
Each chat session is tagged with merchant details, including merchantEmail, shopName, shopDomain, and optional metadata, every merchant has a unique user record, and historical chats are stored and retrievable by user ID/email.

8. Notifications & Availability System
Admin can define available time slots for live chat, and receives real-time notification when a new user message arrives, and email summary is sent if user leaves before response.

9. Integration & Reusability
The component can be imported into any project, and admin panel can be hosted as a separate web app or integrated route.

10. Future Expandable Features
Chat transcript export, search/filter past chat logs in admin panel, real-time typing indicators and chat bubbles, chat rating/feedback system after resolution, and multi-agent support for scaling live support.

You’re building a universal plug-and-play AI support chatbot system with human-in-the-loop escalation, it starts as a single component, triggers automatically when an exception occurs or manually when help is needed, opens a modal-based chat powered by AI for instant debugging help, includes a full admin dashboard to manage user queries, live chat, and train the system using question-answer pairs, every user is uniquely tracked using email and merchant metadata, and fallback email notifications are sent when no agent is available.

Made with Floot.

# Instructions

For security reasons, the `env.json` file is not pre-populated — you will need to generate or retrieve the values yourself.  

For **JWT secrets**, generate a value with:  

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then paste the generated value into the appropriate field.  

For the **Floot Database**, download your database content as a pg_dump from the cog icon in the database view (right pane -> data -> floot data base -> cog icon on the left of the name), upload it to your own PostgreSQL database, and then fill in the connection string value.  

**Note:** Floot OAuth will not work in self-hosted environments.  

For other external services, retrieve your API keys and fill in the corresponding values.  

Once everything is configured, you can build and start the service with:  

```
npm install -g pnpm
pnpm install
pnpm vite build
pnpm tsx server.ts
```
# chatbotAIBased
