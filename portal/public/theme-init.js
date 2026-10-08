(function () {
  try {
    var t = localStorage.getItem("angaradav-portal-theme");
    if (t !== "light" && t !== "dark") t = "dark";
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.style.colorScheme = t;
    var m = document.querySelector('meta[name="color-scheme"]');
    if (m) m.setAttribute("content", t);
    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", t === "light" ? "#f4f6f9" : "#0f1419");
  } catch (e) {}
})();
