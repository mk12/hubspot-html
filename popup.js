"use strict";

let content = document.getElementById("content");
let update = document.getElementById("update");
let result = document.getElementById("result");

function sendToDevTools(payload) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.runtime.sendMessage({
      name: "devtools",
      tabId: tabs[0].id,
      payload: payload,
    }, function(response) {
      switch (response.name) {
      case "devtools":
        let inner = response.payload;
        switch (inner.name) {
          case "listening":
            result.className = "success";
            result.textContent = "Connected to Developer Tools.";
            break;
          case "updated":
            result.className = "success";
            result.textContent = "Success!";
            break;
          case "no-request":
            result.className = "error";
            result.textContent = "Type something in the article, and then try again."
            break;
          case "failed":
            result.className = "error";
            result.textContent = "Sorry, it failed: " + inner.reason + "."
            break;
        }
        return;
      case "no-devtools":
        result.className = "error";
        result.textContent = "You need to open Developer Tools (Cmd+Option+I)."
        return;
      }
      result.className = "error";
      result.textContent = "Something unexpected happened.";
    })
  });
}

sendToDevTools({name: "listen"});
update.onclick = function() {
  sendToDevTools({
    name: "update",
    html: content.value
  });
};
