"use strict";

let background = chrome.runtime.connect({name: "devtools"});

background.postMessage({
  name: "init",
  tabId: chrome.devtools.inspectedWindow.tabId,
});

background.onMessage.addListener(function(message) {
  if (message.name != "popup") {
    console.log("devtools: unexpected message: " + JSON.stringify(message));
    return;
  }
  background.postMessage({
    name: "popup",
    tabId: message.tabId,
    payload: {
      name: "failed"
    }
  });
});
