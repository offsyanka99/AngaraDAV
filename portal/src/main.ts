import "./styles.css";
import { applyStoredTheme } from "./app/theme";
import { mountApp } from "./app";
import { mountInstall } from "./install";

applyStoredTheme();

const root = document.getElementById("app");
if (!root) {
  throw new Error("#app missing");
}

// Portal installer at /portal/install/
const path = window.location.pathname.replace(/\/+$/, "") || "/";
if (path === "/portal/install" || path.endsWith("/portal/install")) {
  void mountInstall(root);
} else {
  mountApp(root);
}
