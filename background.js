"use strict";

// Only enabled the extension on HubSpot pages.
chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {
            hostEquals: "app.hubspot.com",
            pathPrefix: "/knowledge/",
            pathContains: "/edit/"
          },
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
chrome.runtime.onConnect.addListener(port => {
  if (port.name !== "devtools") {
    console.log("background: unexpected connection: " + port.name);
    return;
  }
  let extensionListener = message => {
    switch (message.name) {
    case "log":
      console.log("devtools: ", message.payload);
      break;
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
      console.log("background: unexpected DevTools message: ", message);
      break;
    }
  }

  port.onMessage.addListener(extensionListener);
  port.onDisconnect.addListener(port => {
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
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.name !== "devtools") {
    console.log("background: unexpected message: ", request);
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
