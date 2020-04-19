"use strict";

let background = chrome.runtime.connect({ name: "devtools" });

function log() {
  background.postMessage({
    name: "log",
    payload: arguments
  });
}

background.postMessage({
  name: "init",
  tabId: chrome.devtools.inspectedWindow.tabId,
});

const URL_REGEX =
  /^https:\/\/api\.hubspot\.com\/knowledge-content\/v1\/knowledge-articles\/[0-9]+\?portalId=.+$/;

let latest;

function onRequestFinished(har) {
  let request = har.request;
  if (request.method === "PUT" && URL_REGEX.test(request.url)) {
    latest = request;
  }
}

function findValue(entries, name) {
  for (let i = 0, len = entries.length; i < len; i++) {
    if (entries[i].name.toLowerCase() === name.toLowerCase()) {
      return entries[i].value;
    }
  }
  return null;
}

let listener;

background.onMessage.addListener(message => {
  let respond = payload => {
    background.postMessage({
      name: "response",
      tabId: message.tabId,
      payload: payload
    });
  };
  if (message.name === "request") {
    let inner = message.payload;
    switch (inner.name) {
      case "listen":
        if (listener != undefined) {
          chrome.devtools.network.onRequestFinished.removeListener(listener);
        }
        listener = onRequestFinished;
        chrome.devtools.network.onRequestFinished.addListener(listener);
        respond({ name: "listening" });
        return;
      case "get":
        if (latest == undefined) {
          respond({ name: "no-request" });
        } else {
          respond({ name: "got", payload: latest });
        }
        return;
    }
  }
  log("devtools: unexpected message: ", message);
});
