/**
 * Injects shared sidebar from partials/sidebar.html (requires http(s)://, not file://).
 * Resolves fetch URLs from this script's location so the site works under any path prefix
 * (e.g. https://user.github.io/Repo/docs/quant-trading/).
 */
(function () {
  var host = document.getElementById("sidebar-host");
  if (!host) return;

  function scriptBaseDir() {
    var el = document.currentScript;
    if (!el || !el.src || el.src.indexOf("layout.js") === -1) {
      var scripts = document.getElementsByTagName("script");
      for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i].src;
        if (s && /layout\.js(\?|$)/.test(s)) {
          el = scripts[i];
          break;
        }
      }
    }
    if (!el || !el.src) return new URL("./", location.href).href;
    var u = new URL(el.src, location.href);
    return u.href.replace(/layout\.js(\?.*)?$/i, "");
  }

  var root = scriptBaseDir();

  function normalizePath(p) {
    if (!p) return "/";
    p = String(p).split("?")[0].split("#")[0];
    if (p.endsWith("/")) p = p.slice(0, -1);
    if (p.endsWith("/index.html")) p = p.slice(0, -"/index.html".length);
    return p || "/";
  }

  /** Sidebar partial uses site-root paths; rewrite to absolute URLs for correct resolution from /chapters/*. */
  function absolutizeSidebarHrefs(html) {
    return html.replace(/href="([^"]*)"/g, function (_, href) {
      if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href)) return 'href="' + href + '"';
      if (href.charAt(0) === "#") return 'href="' + href + '"';
      var path = href.charAt(0) === "/" ? href.slice(1) : href;
      return 'href="' + root + path + '"';
    });
  }

  fetch(new URL("partials/sidebar.html", root).href)
    .then(function (r) {
      return r.ok ? r.text() : Promise.reject(new Error(String(r.status)));
    })
    .then(function (html) {
      html = absolutizeSidebarHrefs(html);
      host.outerHTML = html;
      var path = normalizePath(window.location.pathname);
      document.querySelectorAll(".site-sidebar-nav a[href]").forEach(function (a) {
        var resolved = normalizePath(new URL(a.getAttribute("href"), location.href).pathname);
        if (resolved === path) {
          a.setAttribute("aria-current", "page");
          a.classList.add("is-active");
        }
      });
    })
    .catch(function () {
      host.innerHTML =
        '<p style="padding:12px;font-size:12px;color:#888;font-family:var(--font-mono)">Serve this folder over http(s) (e.g. <code style="color:#e07060">python3 -m http.server 3005</code>) so <code style="color:#e07060">partials/sidebar.html</code> loads. Avoid <code style="color:#e07060">file://</code>.</p>';
    });
})();
