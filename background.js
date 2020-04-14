"use strict";

// Only enabled the extension on HubSpot pages.
chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {hostEquals: "app.hubspot.com"},
        })
      ],
      actions: [
        new chrome.declarativeContent.ShowPageAction()
      ]
    }]);
  });
});

// Keep track of DevTools connections.
let connections = {};
let responders = {};
chrome.runtime.onConnect.addListener(function(port) {
  if (port.name !== "devtools") {
    console.log("background: unexpected connection: " + port.name);
    return;
  }
  let extensionListener = function(message) {
    switch (message.name) {
    case "init":
      connections[message.tabId] = port;
      break;
    case "response":
      if (!(message.tabId in responders)) {
        console.log("background: no responder for tab id " + message.tabId);
        return;
      }
      responders[message.tabId]({
        name: "devtools",
        payload: message.payload
      });
      break;
    default:
      console.log("background: unexpected DevTools message: " + JSON.stringify(message));
      break;
    }
  }

  port.onMessage.addListener(extensionListener);
  port.onDisconnect.addListener(function(port) {
    port.onMessage.removeListener(extensionListener);
    let tabs = Object.keys(connections);
    for (let i = 0, len = tabs.length; i < len; i++) {
      if (connections[tabs[i]] == port) {
        delete connections[tabs[i]]
        break;
      }
    }
  });
});

// Forward messages from the popup window to DevTools.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.name !== "devtools") {
    console.log("background: unexpected message: " + JSON.stringify(request));
    return;
  }
  let tabId = request.tabId;
  if (!(tabId in connections)) {
    console.log("No DevTools found for tab " + tabId);
    sendResponse({name: "no-devtools"});
    return;
  }
  responders[tabId] = sendResponse;
  connections[tabId].postMessage({
    name: "request",
    tabId: tabId,
    payload: request.payload,
  });
  return true;
});
