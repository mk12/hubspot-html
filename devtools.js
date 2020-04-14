"use strict";

let background = chrome.runtime.connect({name: "devtools"});

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

function updateArticle(request, html) {
  let data = JSON.parse(request.postData.text);
  data.articleBody = html;
  return sendXHR({
    method: request.method,
    url: request.url,
    timeout: parseInt(findValue(request.queryString, "clienttimeout")),
    withCredentials: true,
    headers: {
      "X-HS-Referer": findValue(request.headers, "X-HS-Referer"),
      "content-type": findValue(request.headers, "content-type"),
      "X-HubSpot-CSRF-hubspotapi": findValue(request.headers, "X-HubSpot-CSRF-hubspotapi"),
      "Accept": findValue(request.headers, "Accept")
    },
    data: JSON.stringify(data)
  });
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

background.onMessage.addListener(function(message) {
  let respond = function(payload) {
    background.postMessage({
      name: "response",
      tabId: message.tabId,
      payload: payload
    });
  }
  if (message.name === "request") {
    let inner = message.payload;
    switch (inner.name) {
    case "listen":
      if (listener != undefined) {
        chrome.devtools.network.onRequestFinished.removeListener(listener);
      }
      listener = onRequestFinished;
      chrome.devtools.network.onRequestFinished.addListener(listener);
      respond({name: "listening"});
      return;
    case "update":
      if (latest == undefined) {
        respond({name: "no-request"});
      } else {
        updateArticle(latest, inner.html).then(function(xhr) {
          if (xhr.status === 200) {
            respond({name: "updated"});
          } else {
            respond({name: "failed", reason: "server responded with" + xhr.status});
          }
        }).catch(function(error) {
          respond({name: "failed", reason: error});
        });
      }
      return;
    }
  }
  console.log("devtools: unexpected message: " + JSON.stringify(message));
});
