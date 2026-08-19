// Runs on every request served by this Cloudflare Pages project.
// Injects a single <script src="/chatbot.js"> tag right before </body>
// on every HTML page, so the chatbot appears everywhere without ever
// touching index.html, services.html, about.html, or any future page.
//
// The actual widget logic lives in chatbot.js at the site root, not here.
// To change the widget (pricing, branding, behavior), edit chatbot.js
// and redeploy, this file should not need to change again.

export async function onRequest(context) {
  const response = await context.next();

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    // Only touch HTML responses, leave CSS/JS/images/etc. untouched.
    return response;
  }

  class InjectChatbotScript {
    element(el) {
      el.append('<script src="/chatbot.js" defer></script>', { html: true });
    }
  }

  return new HTMLRewriter().on("body", new InjectChatbotScript()).transform(response);
}
