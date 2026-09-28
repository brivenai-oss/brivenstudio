export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);

    const contentType = response.headers.get("content-type") || "";

    // Only modify HTML pages.
    if (!contentType.includes("text/html")) {
      return response;
    }

    // Don't inject the Briven Studio bot on client demo pages or client
    // usage dashboards — those ship with their own self-contained widget
    // (demo pages) or shouldn't show your own bot at all (dashboards).
    // Path-based, so anything placed under /demo/ or /clients/ is covered
    // automatically, now and for every future demo or client, no
    // per-file change needed.
    const url = new URL(request.url);
    if (url.pathname.startsWith("/demo/") || url.pathname.startsWith("/clients/")) {
      return response;
    }

    return new HTMLRewriter()
      .on("body", {
        element(element) {
          element.append(
            '<script src="https://brivenstudio.com/widget.js" data-client="briven-studio" defer></script>',
            { html: true }
          );
        }
      })
      .transform(response);
  }
};
