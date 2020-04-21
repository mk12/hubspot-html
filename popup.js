"use strict";

const $dummy = document.createElement("div");

// Decodes HTML entities. For example, "&gt;" or "&#62;" becomes ">".
function decodeEntities(html) {
  $dummy.innerHTML = html;
  return $dummy.textContent;
}

// Encodes HTML entities. For example, ">" becomes "&#62;"
function encodeEntities(str) {
  return str.replace(/[\u00A0-\u9999<>\&]/gim, char => {
    return "&#" + char.charCodeAt(0) + ";";
  });
}

// Parses the combined HTML input into { title, subtile, body } parts.
function parse(html) {
  let title;
  const h1 = /^\s*<h1>([^<]*)<\/h1>/i.exec(html);
  if (h1) {
    title = decodeEntities(h1[1]).trim();
    html = html.substring(h1.index + h1[0].length);
  }
  let subtitle;
  const h2 = /^\s*<h2>([^<]*)<\/h2>/i.exec(html);
  if (h2) {
    subtitle = decodeEntities(h2[1]).trim();
    html = html.substring(h2.index + h2[0].length);
  }
  html = html.trim();
  return {
    title: title,
    subtitle: subtitle,
    body: html
  };
}

// Unparses { title, subtitle, body } parts back to combined HTML.
function unparse(parts) {
  return (
    "<h1>" + encodeEntities(parts.title) + "</h1>\n"
    + "<h2>" + encodeEntities(parts.subtitle) + "</h2>\n"
    + parts.body
  );
}

// Runs f with the current tab.
function withTab(f) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    f(tabs[0]);
  });
}

// Copies text to the clipboard.
function copyText(text) {
  const $input = document.createElement("textarea");
  document.body.appendChild($input);
  $input.value = text;
  $input.focus();
  $input.select();
  document.execCommand("copy");
  $input.remove();
}

// Sends a message to DevTools.
function sendToDevTools(loud, payload, callback) {
  withTab(tab => {
    chrome.runtime.sendMessage({
      name: "devtools",
      tabId: tab.id,
      payload: payload,
    }, {}, response => {
      switch (response.name) {
        case "devtools":
          let inner = response.payload;
          switch (inner.name) {
            case "listening":
              result.className = "success";
              result.textContent = "Connected to Developer Tools.";
              break;
            case "got":
              callback(response);
              result.className = "success";
              result.textContent = "Copied latest request in HAR format to the clipboard!";
              break;
            case "no-request":
              result.className = "error";
              result.textContent = "Type something in the article, and then try again."
              break;
          }
          return;
        case "no-devtools":
          if (loud) {
            result.className = "error";
            result.textContent = "You need to open Developer Tools (Cmd+Option+I)."
          }
          return;
      }
      result.className = "error";
      result.textContent = "Something unexpected happened.";
    })
  });
}

const $content = document.getElementById("content");
const $result = document.getElementById("result");
const $update = document.getElementById("update");
const $copy = document.getElementById("copy");

window.onload = () => {
  withTab(tab => {
    chrome.tabs.sendMessage(tab.id, { name: "get" }, {}, response => {
      $content.value = unparse(response.payload);
    });
  });
  sendToDevTools(false, { name: "listen" });
};

$update.onclick = () => {
  withTab(tab => {
    chrome.tabs.sendMessage(tab.id, {
      name: "set",
      payload: parse(content.value),
    });
  });
};

$copy.onclick = () => {
  sendToDevTools(true, { name: "get" }, response => {
    copyText(JSON.stringify(response.payload));
  });
};
