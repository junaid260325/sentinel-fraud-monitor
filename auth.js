"use strict";

const SESSION_KEY = "sentinel-demo-session";
const pageName = window.location.pathname.split("/").pop();
const signOutRequested = new URLSearchParams(window.location.search).has("signout");
const protectedPages = new Set(["dashboard.html", "transactions.html", "risk-model.html"]);

if (signOutRequested) {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.replace("index.html");
} else if (protectedPages.has(pageName) && sessionStorage.getItem(SESSION_KEY) !== "active") {
  window.location.replace(`index.html?next=${encodeURIComponent(pageName)}`);
}
