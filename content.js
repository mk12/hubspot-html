"use strict";

function findTitle() {
  const $element = document.querySelector("textarea.article-title-text");
  if ($element) {
    return $element;
  }
  const $textareas = document.getElementsByName("textarea");
  if ($textareas.length === 2) {
    return $textareas[0];
  }
  console.log("content: failed to find title textarea");
  return { value: "ERROR" };
}

function findSubtitle() {
  const $element = document.querySelector("textarea.article-subtitle-text");
  if ($element) {
    return $element;
  }
  const $textareas = document.getElementsByName("textarea");
  if ($textareas.length === 2) {
    return $textareas[1];
  }
  console.log("content: failed to find subtitle textarea");
  return { value: "ERROR" };
}

function findBody() {
  for (let i = 1; i < 10; i++) {
    const $element = document.getElementById("react-tinymce-" + i);
    if ($element != undefined && $element.isContentEditable) {
      return $element;
    }
  }
  console.log("content: failed to find tinymce body div");
  return { innerHTML: "ERROR" };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.name) {
    case "get":
      sendResponse({
        ok: true,
        payload: {
          title: findTitle().value,
          subtitle: findSubtitle().value,
          body: findBody().innerHTML
        }
      });
      break;
    case "set":
      if (message.payload.title != undefined) {
        findTitle().value = message.payload.title;
      }
      if (message.payload.subtitle != undefined) {
        findSubtitle().value = message.payload.subtitle;
      }
      if (message.payload.body != undefined) {
        findBody().innerHTML = message.payload.body;
      }
      sendResponse({ ok: true });
      break;
    default:
      console.log("content: unexpected message: ", message);
      break;
  }
});
