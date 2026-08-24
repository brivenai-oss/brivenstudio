export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);

    const contentType = response.headers.get("content-type") || "";

    // Only modify HTML pages.
    if (!contentType.includes("text/html")) {
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