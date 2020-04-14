"use strict";

function sendXHR(options) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();

    xhr.open(options.method || "GET", options.url, true);

    if (typeof options.timeout === "number") {
      xhr.timeout = options.timeout;
    }

    xhr.withCredentials = options.withCredentials;

    Object.keys(options.headers || {}).forEach(function (headerName) {
      if (options.headers[headerName] !== false) {
        xhr.setRequestHeader(headerName, options.headers[headerName]);
      }
    });

    xhr.addEventListener("load", function () {
      resolve(xhr);
    });

    xhr.addEventListener("error", function () {
      reject("there was a network error");
    });

    xhr.addEventListener("timeout", function () {
      reject("the request timed out");
    });

    xhr.addEventListener("abort", function () {
      reject("the request was aborted");
    });

    xhr.send(typeof options.data === "undefined" ? null : options.data);
  });
}
