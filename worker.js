export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);

    const contentType = response.headers.get("content-type") || "";

    // Only modify HTML pages.
    if (!contentType.includes("text/html")) {
      return response;
    }

    // Don't inject the Briven Studio bot on client demo pages — those ship
    // with their own self-contained client-specific widget already built in
    // by the Generator (generateLandingPage / buildWidgetTemplate). This is
    // path-based, so anything placed under /demo/ is covered automatically,
    // now and for every future demo, no per-file change needed.
    const url = new URL(request.url);
    if (url.pathname.startsWith("/demo/")) {
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
