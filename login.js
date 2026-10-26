"use strict";

const SESSION_KEY = "sentinel-demo-session";
const allowedPages = new Set(["dashboard.html", "transactions.html", "risk-model.html"]);
const form = document.querySelector("#login-form");
const query = new URLSearchParams(window.location.search);

if (query.has("signout")) {
  sessionStorage.removeItem(SESSION_KEY);
  window.history.replaceState(null, "", "index.html");
} else if (sessionStorage.getItem(SESSION_KEY) === "active") {
  window.location.replace("dashboard.html");
} else if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    sessionStorage.setItem(SESSION_KEY, "active");
    const requestedPage = query.get("next");
    const destination = allowedPages.has(requestedPage) ? requestedPage : "dashboard.html";
    window.location.replace(destination);
  });
}
