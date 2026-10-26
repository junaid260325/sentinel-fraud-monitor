"use strict";

const AUTH_KEY = "sentinel-demo-auth";
const DEMO_EMAIL = "jordan.davis@sentinel.demo";
const DEMO_PASSWORD = "SentinelDemo26!";
const form = document.querySelector("#login-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const errorMessage = document.querySelector("#form-error");

function alreadySignedIn() {
  try {
    if (sessionStorage.getItem(AUTH_KEY) === "true") return true;
  } catch (error) {
    console.warn("Session storage is unavailable:", error);
  }
  try {
    return localStorage.getItem(AUTH_KEY) === "true";
  } catch (error) {
    console.warn("Local storage is unavailable:", error);
    return false;
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.hidden = true;
}

if (alreadySignedIn()) {
  location.replace("dashboard.html");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearError();
  if (!emailInput.validity.valid || !emailInput.value.trim()) {
    showError("Enter a valid work email address.");
    emailInput.focus();
    return;
  }
  if (!passwordInput.value) {
    showError("Enter your password.");
    passwordInput.focus();
    return;
  }
  if (emailInput.value.trim().toLowerCase() !== DEMO_EMAIL || passwordInput.value !== DEMO_PASSWORD) {
    showError("Those demo credentials don't match. Use the sign-in details shown below.");
    passwordInput.focus();
    return;
  }
  try {
    const storage = document.querySelector("#remember-me").checked ? localStorage : sessionStorage;
    const otherStorage = storage === localStorage ? sessionStorage : localStorage;
    otherStorage.removeItem(AUTH_KEY);
    storage.setItem(AUTH_KEY, "true");
    location.assign("dashboard.html");
  } catch (error) {
    console.error("Could not start the demo session:", error);
    showError("Your browser blocked local sign-in storage. Allow site storage and try again.");
  }
});

document.querySelector("#password-toggle").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const showing = passwordInput.type === "password";
  passwordInput.type = showing ? "text" : "password";
  button.textContent = showing ? "Hide" : "Show";
  button.setAttribute("aria-label", showing ? "Hide password" : "Show password");
});

document.querySelector("#copy-email").addEventListener("click", () => {
  emailInput.value = DEMO_EMAIL;
  clearError();
  passwordInput.focus();
});

document.querySelector("#copy-password").addEventListener("click", () => {
  passwordInput.value = DEMO_PASSWORD;
  clearError();
  emailInput.focus();
});

emailInput.addEventListener("input", clearError);
passwordInput.addEventListener("input", clearError);
