export const getDemoHtmlContent = (origin: string): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PrimeCaves Chat Widget Demo</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6; 
            padding: 2rem; 
            max-width: 800px; 
            margin: auto; 
            color: #333; 
            background-color: #f4f4f9;
        }
        .container { 
            background: #ffffff; 
            padding: 2rem; 
            border-radius: 8px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
        }
        h1 { 
            color: #1a1a1a;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 0.5rem;
        }
        p {
            margin-bottom: 1rem;
        }
        .button-group {
            margin-top: 1.5rem;
        }
        button { 
            background-color: #6366f1; 
            color: white; 
            border: none; 
            padding: 12px 20px; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 16px; 
            margin-right: 10px;
            transition: background-color 0.2s ease-in-out;
        }
        button:hover { 
            background-color: #4f46e5; 
        }
        code { 
            background: #eee; 
            padding: 3px 6px; 
            border-radius: 4px; 
            font-family: "Courier New", Courier, monospace;
        }
        .footer {
            margin-top: 2rem;
            text-align: center;
            font-size: 0.9rem;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>PrimeCaves Chat Widget Demo</h1>
        
        <p>This is a demonstration page for the PrimeCaves AI Support Chatbot. The widget script is loaded at the end of the <code>&lt;body&gt;</code> tag and initialized with sample data.</p>
        
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.</p>
        
        <p>Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede.</p>

        <div class="button-group">
            <button onclick="PrimeCavesChatWidget.open()">Open Widget</button>
            <button onclick="triggerError()">Trigger Error Demo</button>
            <button onclick="PrimeCavesChatWidget.close()">Close Widget</button>
        </div>
    </div>

    <div class="footer">
        <p>Open your browser's developer console to see widget logs.</p>
    </div>

    <!-- 
      STEP 1: Add the PrimeCaves Chat Widget SDK script to your page.
      This script is served dynamically from your application's domain.
    -->
    <script src="${origin}/_api/widget-sdk" defer></script>

    <!-- 
      STEP 2: Initialize the widget with your specific configuration.
      This should be placed after the SDK script.
    -->
    <script>
      // This function is called after the SDK script has loaded.
      window.onPrimeCavesChatWidgetReady = function() {
        console.log("PrimeCaves Chat Widget is ready to be initialized.");
        
        // Customize these settings for your application
        PrimeCavesChatWidget.init({
          merchantEmail: 'demo@example.com',
          shopName: 'Demo Shop',
          shopDomain: 'demo.myshopify.com',
          primaryColor: '#6366f1', // Optional: Customize widget color
          agentName: 'Demo Support Agent' // Optional: Customize agent display name
        });
      };

      // Example function to demonstrate error handling
      function triggerError() {
        try {
          // This will cause a ReferenceError
          nonExistentFunction();
        } catch (error) {
          console.error("A demo error was triggered:", error);
          // The widget can be opened with specific error context
          PrimeCavesChatWidget.open({
            errorContext: \`Error Name: \${error.name}\\nError Message: \${error.message}\\nStack: \${error.stack}\`
          });
        }
      }
    </script>
</body>
</html>
  `;
};