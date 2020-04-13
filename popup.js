"use strict";

let content = document.getElementById("content");
let update = document.getElementById("update");
let result = document.getElementById("result");

update.onclick = function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    let request = {
      name: "update",
      tabId: tabs[0].id,
      html: content.value,
    };
    chrome.runtime.sendMessage(request, function(response) {
      switch (response.name) {
      case "no-devtools":
        result.className = "error";
        result.textContent = "You need to open Developer Tools (Cmd+Option+I)."
        return;
      case "devtools":
        let inner = response.payload;
        switch (inner.name) {
          case "ok":
            result.className = "success";
            result.textContent = "Success!";
            break;
          case "failed":
            result.className = "error";
            result.textContent = "Sorry, it failed."
            break;
        }
        return;
      }
      result.className = "error";
      result.textContent = "Something unexpected happened.";
    });
  });
};
