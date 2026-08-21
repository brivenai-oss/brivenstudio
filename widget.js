// Briven Studio — Shared AI Chat Widget
// One file, hosted once, loaded by every client's site with a single line:
//   <script src="https://widget.brivenstudio.com/widget.js" data-client="SLUG" defer></script>
//
// Reads its own data-client attribute, fetches that client's cosmetic
// config (name, colors, greeting, logo) from the relay's /config route,
// and builds the widget from it. The system prompt is never sent to the
// browser at all, it's looked up server-side, only at the moment a
// message is actually sent, by the relay's chat route.
//
// Because this file is generic (not regenerated per client), the widget's
// element IDs don't carry a per-client slug the way the old per-client
// snippets did, there's no risk of collision since each page only ever
// loads one client's config at a time.
//
// To update the widget's behavior or design for EVERY client at once,
// edit this file and redeploy it, nothing on any client's site changes.

(function () {
  var scriptTag = document.currentScript;
  if (!scriptTag) {
    console.error("[Briven widget] Could not find its own <script> tag (document.currentScript was empty).");
    return;
  }

  var clientId = scriptTag.getAttribute("data-client");
  if (!clientId) {
    console.error("[Briven widget] Missing required data-client attribute on the <script> tag.");
    return;
  }

  // Can be overridden per-site with a data-relay attribute, but defaults
  // to the one shared relay so the embed code stays a single line.
  var RELAY_BASE = scriptTag.getAttribute("data-relay") || "https://widget-relay.brivenstudio.com";

  fetch(RELAY_BASE + "/config?client=" + encodeURIComponent(clientId))
    .then(function (r) {
      return r.json();
    })
    .then(function (cfg) {
      if (cfg.error) {
        console.error("[Briven widget] " + cfg.error);
        return;
      }
      initWidget(cfg);
    })
    .catch(function () {
      console.error("[Briven widget] Could not reach the relay to load this client's config.");
    });

  function initWidget(CONFIG) {
    var history = [];
    var open = false;
    var sessionId = clientId + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

    var root = document.createElement("div");
    root.id = "ccw-root";
    document.body.appendChild(root);

    var style = document.createElement("style");
    style.textContent = [
      "#ccw-bubble{position:fixed;bottom:20px;right:20px;width:58px;height:58px;border-radius:50%;",
      "background:" + CONFIG.brandColor + ";box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer;z-index:99998;",
      "display:flex;align-items:center;justify-content:center;font-size:26px;color:#fff;border:none;overflow:hidden;padding:0;}",
      "#ccw-callout{position:fixed;bottom:32px;right:90px;max-width:200px;background:#fff;color:#222;",
      "padding:10px 14px;border-radius:14px;box-shadow:0 4px 14px rgba(0,0,0,.2);font-size:13px;line-height:1.4;",
      "z-index:99997;cursor:pointer;display:flex;align-items:center;gap:8px;}",
      "#ccw-callout-close{background:none;border:none;color:#999;font-size:15px;cursor:pointer;line-height:1;padding:0;flex-shrink:0;}",
      "#ccw-panel{position:fixed;bottom:90px;right:20px;width:320px;max-width:90vw;height:440px;",
      "max-height:70vh;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.25);z-index:99999;",
      "display:none;flex-direction:column;overflow:hidden;font-family:Arial,sans-serif;}",
      "#ccw-panel.ccw-open{display:flex;}",
      "#ccw-header{background:" + CONFIG.brandColor + ";color:#fff;padding:14px 16px;font-weight:bold;",
      "display:flex;justify-content:space-between;align-items:center;font-size:14px;}",
      "#ccw-header-left{display:flex;align-items:center;gap:8px;}",
      "#ccw-header img{width:22px;height:22px;border-radius:50%;object-fit:cover;}",
      "#ccw-close{cursor:pointer;font-size:18px;line-height:1;background:none;border:none;color:#fff;}",
      "#ccw-messages{flex:1;overflow-y:auto;padding:12px;font-size:13.5px;background:#F7F7F5;}",
      ".ccw-msg{margin-bottom:10px;padding:8px 11px;border-radius:10px;max-width:85%;line-height:1.4;",
      "overflow-wrap:anywhere;word-break:break-word;}",
      ".ccw-msg.user{background:" + CONFIG.brandColor + ";color:#fff;margin-left:auto;}",
      ".ccw-msg.bot{background:#fff;color:#222;border:1px solid #E2E2DE;}",
      ".ccw-msg a{color:inherit;text-decoration:underline;font-weight:600;}",
      "#ccw-inputrow{display:flex;border-top:1px solid #E2E2DE;padding:8px;background:#fff;}",
      "#ccw-input{flex:1;border:1px solid #E2E2DE;border-radius:20px;padding:8px 12px;font-size:13px;outline:none;}",
      "#ccw-send{background:" + CONFIG.brandColor + ";color:#fff;border:none;border-radius:20px;",
      "padding:8px 14px;margin-left:6px;cursor:pointer;font-size:13px;}",
    ].join("");
    document.head.appendChild(style);

    // Escapes HTML first (message text can come from the AI or a visitor,
    // never trust it raw), then wraps any http(s)/www URL in a real,
    // clickable link that opens in a new tab.
    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
    function linkify(text) {
      var escaped = escapeHtml(text);
      var urlRegex = /((https?:\/\/|www\.)[^\s<>"']+)/gi;
      return escaped.replace(urlRegex, function (match) {
        var trailing = "";
        var trailingMatch = match.match(/[.,;:!?)\]]+$/);
        if (trailingMatch) {
          trailing = trailingMatch[0];
          match = match.slice(0, match.length - trailing.length);
        }
        var href = /^https?:\/\//i.test(match) ? match : "https://" + match;
        return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + match + "</a>" + trailing;
      });
    }

    var bubble = document.createElement("button");
    bubble.id = "ccw-bubble";
    bubble.innerHTML = "&#128172;";
    bubble.onclick = function () {
      hideCallout();
      togglePanel();
    };

    var panel = document.createElement("div");
    panel.id = "ccw-panel";
    var headerLogoHtml = CONFIG.logoUrl
      ? '<img src="' + CONFIG.logoUrl + '" onerror="this.style.display=\'none\'">'
      : "";
    panel.innerHTML =
      '<div id="ccw-header"><div id="ccw-header-left">' +
      headerLogoHtml +
      "<span>" +
      escapeHtml(CONFIG.businessName || "") +
      "</span></div>" +
      '<button id="ccw-close">&times;</button></div>' +
      '<div id="ccw-messages"></div>' +
      '<div id="ccw-inputrow">' +
      '<input id="ccw-input" type="text" placeholder="Type a message..." />' +
      '<button id="ccw-send">Send</button></div>';

    root.appendChild(bubble);
    root.appendChild(panel);

    var callout = null;
    if (CONFIG.attentionText) {
      callout = document.createElement("div");
      callout.id = "ccw-callout";
      callout.innerHTML =
        "<span>" + escapeHtml(CONFIG.attentionText) + '</span><button id="ccw-callout-close">&times;</button>';
      callout.addEventListener("click", function (e) {
        if (e.target && e.target.id === "ccw-callout-close") {
          hideCallout();
          return;
        }
        hideCallout();
        togglePanel();
      });
      root.appendChild(callout);
    }

    function hideCallout() {
      if (callout && callout.parentNode) {
        callout.parentNode.removeChild(callout);
        callout = null;
      }
    }

    document.getElementById("ccw-close").onclick = togglePanel;
    document.getElementById("ccw-send").onclick = sendMessage;
    document.getElementById("ccw-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") sendMessage();
    });

    function togglePanel() {
      open = !open;
      panel.classList.toggle("ccw-open", open);
      if (open && history.length === 0) {
        addMessage("bot", CONFIG.greeting || "Hi! How can I help?");
      }
    }

    function addMessage(role, text) {
      var el = document.createElement("div");
      el.className = "ccw-msg " + (role === "user" ? "user" : "bot");
      el.innerHTML = linkify(text);
      document.getElementById("ccw-messages").appendChild(el);
      el.scrollIntoView({ behavior: "smooth", block: "end" });
    }

    function sendMessage() {
      var input = document.getElementById("ccw-input");
      var text = input.value.trim();
      if (!text) return;
      input.value = "";
      addMessage("user", text);
      history.push({ role: "user", content: text });
      addMessage("bot", "...");
      var thinkingEl = document.getElementById("ccw-messages").lastChild;

      // Only clientId and the conversation go over the wire, never a
      // system prompt, the relay looks that up itself, server-side.
      fetch(RELAY_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: clientId, messages: history }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          thinkingEl.remove();
          var reply = data.reply || "Sorry, something went wrong on my end, please try again in a moment.";

          var markerStart = reply.indexOf("[[LEAD::");
          var markerEnd = markerStart > -1 ? reply.indexOf("]]", markerStart) : -1;
          if (markerStart > -1 && markerEnd > -1) {
            var leadRaw = reply.substring(markerStart + 8, markerEnd);
            reply = (reply.substring(0, markerStart) + reply.substring(markerEnd + 2)).trim();
            if (CONFIG.leadWebhookUrl) {
              var fields = {};
              leadRaw.split("|").forEach(function (pair) {
                var idx = pair.indexOf("=");
                if (idx > -1) {
                  fields[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
                }
              });

              var isPlaceholderText = function (str) {
                var s2 = (str || "").trim();
                if (!s2) return true;
                if (s2.indexOf("<") > -1 || s2.indexOf(">") > -1) return true;
                var lower = s2.toLowerCase();
                var generic = [
                  "your name",
                  "your phone",
                  "phone number",
                  "customer name",
                  "name here",
                  "enter name",
                  "n/a",
                  "none",
                  "unknown",
                  "replace_with",
                  "your email",
                  "email address",
                ];
                for (var i = 0; i < generic.length; i++) {
                  if (lower.indexOf(generic[i]) > -1) return true;
                }
                return false;
              };
              var looksLikePhoneNumber = function (str) {
                var digitsOnly = (str || "").replace(/[^0-9]/g, "");
                return digitsOnly.length >= 7;
              };
              var looksLikeEmail = function (str) {
                var s2 = (str || "").trim();
                var atIndex = s2.indexOf("@");
                if (atIndex < 1) return false;
                var afterAt = s2.slice(atIndex + 1);
                var dotIndex = afterAt.indexOf(".");
                return dotIndex > 0 && dotIndex < afterAt.length - 1 && s2.indexOf(" ") === -1;
              };

              var nameOk = !isPlaceholderText(fields.name);
              var contactOk =
                !isPlaceholderText(fields.contact) &&
                (looksLikePhoneNumber(fields.contact) || looksLikeEmail(fields.contact));

              if (nameOk && contactOk) {
                fetch(CONFIG.leadWebhookUrl, {
                  method: "POST",
                  mode: "no-cors",
                  headers: { "Content-Type": "text/plain" },
                  body: JSON.stringify({
                    business: CONFIG.businessName,
                    name: fields.name,
                    contact: fields.contact,
                    address: fields.address || "",
                    note: fields.note || "",
                    timestamp: new Date().toISOString(),
                  }),
                }).catch(function () {});
              }
            }
          }

          if (CONFIG.transcriptWebhookUrl) {
            fetch(CONFIG.transcriptWebhookUrl, {
              method: "POST",
              mode: "no-cors",
              headers: { "Content-Type": "text/plain" },
              body: JSON.stringify({
                business: CONFIG.businessName,
                sessionId: sessionId,
                visitorMessage: text,
                botReply: reply,
                timestamp: new Date().toISOString(),
              }),
            }).catch(function () {});
          }

          addMessage("bot", reply);
          history.push({ role: "assistant", content: reply });
        })
        .catch(function () {
          thinkingEl.remove();
          addMessage("bot", "Sorry, I'm having trouble connecting right now. Please try again shortly.");
        });
    }
  }
})();
