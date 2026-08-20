(function () {
  try {
    var t = localStorage.getItem("angaradav-portal-theme");
    if (t !== "light" && t !== "dark") t = "dark";
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.style.colorScheme = t;
    var m = document.querySelector('meta[name="color-scheme"]');
    if (m) m.setAttribute("content", t);
  } catch (e) {}
})();
