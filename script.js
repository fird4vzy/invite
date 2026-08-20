/* ============================================================
   4ManuU — приглашение
   Механики: прелоадер, зерно, несовмещение красок, заливка
   clip-path, горизонтальный трек, инверсия темы, разбивка
   текста, магнитная «Да» и убегающая «Нет».

   Один файл на обе страницы, поэтому каждый блок проверяет
   свой DOM: отсутствующий элемент не должен ломать страницу.
   GSAP тоже необязателен — без него всё остаётся читаемым.
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canHover = window.matchMedia &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var hasGSAP = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.remove("no-gsap");
  }

  /* ----------------------------------------------------------
     Подписи под устройство
     «Наведи курсор» на телефоне — бессмыслица.
     ---------------------------------------------------------- */
  function applyDeviceCopy() {
    document.querySelectorAll("[data-hover][data-touch]").forEach(function (el) {
      var text = el.getAttribute(canHover ? "data-hover" : "data-touch");
      if (text) el.textContent = text;
    });
  }

  /* ----------------------------------------------------------
     Подарки

     Открываются наведением, тапом и с клавиатуры. Наведение —
     «подсмотреть», клик — «закрепить». Пока гифка качается,
     показываем индикатор: badass.gif весит ~8.5 МБ.
     ---------------------------------------------------------- */
  function setupGifts() {
    var cards = document.querySelectorAll(".gift[data-reveal]");
    if (!cards.length) return;

    var queue = [];

    cards.forEach(function (card) {
      var src = card.getAttribute("data-reveal");
      var layer = card.querySelector(".gift__reveal");
      var loaded = false, pending = false, wanted = false, pinned = false;
      var waiting = [];

      function paint() {
        if (layer) layer.style.setProperty("--reveal-src", 'url("' + src + '")');
        card.classList.remove("is-loading");
        card.classList.add("is-open");
      }

      function load(done, priority) {
        if (loaded) { if (done) done(); return; }
        if (pending) { if (done) waiting.push(done); return; }
        pending = true;

        var img = new Image();
        if (priority) img.fetchPriority = priority;
        img.onload = img.onerror = function () {
          loaded = true; pending = false;
          if (done) done();
          while (waiting.length) waiting.shift()();
        };
        img.src = src;
      }

      function open() {
        wanted = true;
        if (card.classList.contains("is-open")) return;
        if (loaded) { paint(); return; }
        card.classList.add("is-loading");
        load(function () {
          // курсор мог уйти, пока гифка качалась — не открываем вслепую
          if (wanted) paint();
          else card.classList.remove("is-loading");
        }, "high");
      }

      function close() {
        wanted = false;
        card.classList.remove("is-open", "is-loading");
      }

      function toggle() {
        pinned = !pinned;
        card.setAttribute("aria-pressed", pinned ? "true" : "false");
        if (pinned) open();
        // на тач-устройстве после тапа элемент остаётся :hover,
        // поэтому проверка имеет смысл только с настоящим курсором
        else if (!canHover || !card.matches(":hover")) close();
      }

      card.setAttribute("aria-pressed", "false");

      if (canHover) {
        card.addEventListener("mouseenter", function () { if (!pinned) open(); });
        card.addEventListener("mouseleave", function () { if (!pinned) close(); });
        card.addEventListener("focus", function () { if (!pinned) open(); });
        card.addEventListener("blur", function () { if (!pinned) close(); });
      }

      card.addEventListener("click", toggle);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          toggle();
        }
      });

      queue.push(load);
    });

    // Прогреваем гифки по одной, когда страница уже загрузилась,
    // чтобы первое наведение не упиралось в пустой квадрат.
    var conn = navigator.connection || {};
    if (conn.saveData || /2g/.test(conn.effectiveType || "")) return;

    var i = 0;
    function warmNext() {
      if (i >= queue.length) return;
      queue[i++](warmNext, "low");
    }
    if (document.readyState === "complete") setTimeout(warmNext, 900);
    else window.addEventListener("load", function () { setTimeout(warmNext, 900); });
  }

  /* ----------------------------------------------------------
     Прелоадер
     Смысл не спрятать загрузку, а задать ритм.
     ---------------------------------------------------------- */
  function playLoader(next) {
    var loader = document.getElementById("loader");
    if (!loader) return next();
    if (reduced || !hasGSAP) { loader.style.display = "none"; return next(); }

    var obj = { v: 0 };
    var count = document.getElementById("count");
    var bar = document.getElementById("bar");

    gsap.timeline()
      .to(obj, {
        v: 100, duration: 1.3, ease: "power2.inOut",
        onUpdate: function () {
          var n = Math.round(obj.v);
          if (count) count.textContent = String(n).padStart(2, "0");
          if (bar) bar.style.width = n + "%";
        }
      })
      .to(loader, { yPercent: -100, duration: .9, ease: "power4.inOut" })
      .set(loader, { display: "none" })
      .add(next, "-=0.4");
  }

  /* ----------------------------------------------------------
     Сцены
     ---------------------------------------------------------- */
  function buildScenes() {
    if (!hasGSAP || reduced) return;

    // 01 · появление героя
    gsap.from(".hero > *", { y: 40, opacity: 0, duration: 1, stagger: .08, ease: "power3.out" });

    // 02 · заливка краской через clip-path
    if (document.getElementById("maskFill")) {
      gsap.to("#maskFill", {
        clipPath: "inset(0% 0 0 0)",
        ease: "none",
        scrollTrigger: { trigger: ".mask-wrap", start: "top 85%", end: "bottom 65%", scrub: .6 }
      });
    }

    // 03 · вертикальный скролл двигает трек по горизонтали
    var track = document.getElementById("hTrack");
    if (track) {
      var distance = function () { return track.scrollWidth - window.innerWidth; };
      // На очень широком экране трек помещается целиком: пин ради 50px
      // хода выглядит как заедание, поэтому оставляем обычную секцию.
      if (distance() < 200) {
        var outer = document.getElementById("gifts");
        if (outer) outer.classList.add("is-static");
      } else {
        gsap.to(track, {
          x: function () { return -distance(); },
          ease: "none",
          scrollTrigger: {
            trigger: "#gifts",
            start: "top top",
            // запас сверх дистанции: со scrub-инерцией трек догоняет
            // прокрутку с отставанием, и без запаса секция открепляется
            // раньше, чем доезжает последняя карточка
            end: function () { return "+=" + (distance() + window.innerHeight * 0.5); },
            pin: true,
            scrub: .4,
            invalidateOnRefresh: true
          }
        });
      }
    }

    // 04 · тема переключается не кнопкой, а местом в истории
    var root = document.documentElement;
    var dark  = { bg: "#3B0A1B", fg: "#FCF3EF" };
    var light = { bg: "#FCF3EF", fg: "#3B0A1B" };
    var apply = function (t) {
      root.style.setProperty("--bg", t.bg);
      root.style.setProperty("--fg", t.fg);
    };
    if (document.querySelector('[data-theme="dark"]')) {
      ScrollTrigger.create({
        trigger: '[data-theme="dark"]',
        start: "top 50%",
        end: "bottom 50%",
        onEnter: function () { apply(dark); },
        onEnterBack: function () { apply(dark); },
        onLeave: function () { apply(light); },
        onLeaveBack: function () { apply(light); }
      });
    }

    // 05 · вопрос выезжает по словам
    var split = document.getElementById("split");
    if (split) {
      split.innerHTML = split.textContent.trim().split(/\s+/)
        .map(function (w) {
          var emoji = /\p{Extended_Pictographic}/u.test(w) ? " is-emoji" : "";
          return '<span class="w' + emoji + '"><span>' + w + "</span></span>";
        }).join(" ");
      gsap.set("#split .w > span", { yPercent: 105 });
      gsap.to("#split .w > span", {
        yPercent: 0, duration: .8, ease: "power3.out", stagger: .06,
        scrollTrigger: { trigger: split, start: "top 78%" }
      });
    }

    ScrollTrigger.refresh();
  }

  /* ----------------------------------------------------------
     Несовмещение красок
     Скорость скролла разводит розовую и фиолетовую копии текста.
     ---------------------------------------------------------- */
  function inkDrift() {
    if (!hasGSAP || reduced) return;

    // В покое краски остаются слегка разведёнными — иначе сигнатурный
    // приём виден только во время быстрого скролла, то есть почти никогда.
    var REST = 2.6;
    var target = 0, current = 0;

    ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      onUpdate: function (self) {
        target = gsap.utils.clamp(-9, 9, self.getVelocity() / 200);
      }
    });
    gsap.ticker.add(function () {
      target *= 0.92;                                  // скорость стремится к нулю
      current = gsap.utils.interpolate(current, target, .2);
      var off = REST + current;                        // но смещение — к REST
      var s = document.documentElement.style;
      s.setProperty("--mx", off.toFixed(2) + "px");
      s.setProperty("--my", (off * .45).toFixed(2) + "px");
    });
  }

  /* ----------------------------------------------------------
     Курсор
     ---------------------------------------------------------- */
  function customCursor() {
    var cur = document.getElementById("cursor");
    if (!cur) return;
    if (!hasGSAP || reduced || !canHover) { cur.style.display = "none"; return; }

    document.body.classList.add("has-cursor");
    var pos = { x: innerWidth / 2, y: innerHeight / 2 };
    var mouse = { x: pos.x, y: pos.y };

    addEventListener("mousemove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    gsap.ticker.add(function () {
      pos.x = gsap.utils.interpolate(pos.x, mouse.x, .18);
      pos.y = gsap.utils.interpolate(pos.y, mouse.y, .18);
      cur.style.transform = "translate(" + pos.x + "px," + pos.y + "px) translate(-50%,-50%)";
    });

    document.querySelectorAll("a, button, .gift").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cur.classList.add("is-big"); });
      el.addEventListener("mouseleave", function () { cur.classList.remove("is-big"); });
    });
  }

  /* ----------------------------------------------------------
     «Да» притягивает курсор, «Нет» — отталкивается.
     Одна и та же магнитная механика с разным знаком.
     ---------------------------------------------------------- */
  function setupChoice() {
    var yes = document.getElementById("btn-yes");
    var no = document.getElementById("noButton");
    var area = document.getElementById("choice");
    if (!yes || !no || !area) return;

    if (hasGSAP && !reduced && canHover) {
      yes.addEventListener("mousemove", function (e) {
        var r = yes.getBoundingClientRect();
        gsap.to(yes, {
          x: (e.clientX - (r.left + r.width / 2)) * .35,
          y: (e.clientY - (r.top + r.height / 2)) * .35,
          duration: .4
        });
      });
      yes.addEventListener("mouseleave", function () {
        gsap.to(yes, { x: 0, y: 0, duration: .6, ease: "elastic.out(1,.4)" });
      });
    }

    var dodges = 0;

    function cutLoose() {
      if (no.classList.contains("is-loose")) return;
      var a = area.getBoundingClientRect();
      var b = no.getBoundingClientRect();
      no.style.width = b.width + "px";
      no.classList.add("is-loose");
      setPos(b.left - a.left, b.top - a.top, 0);
    }

    function setPos(x, y, dur) {
      if (hasGSAP && !reduced) gsap.to(no, { x: x, y: y, duration: dur, ease: "power3.out" });
      else no.style.transform = "translate(" + x + "px," + y + "px)";
    }

    function dodge() {
      cutLoose();

      var a = area.getBoundingClientRect();
      var b = no.getBoundingClientRect();
      var yb = yes.getBoundingClientRect();
      var maxX = Math.max(0, a.width - b.width);
      var maxY = Math.max(0, a.height - b.height);
      var gap = 16;

      var nowX = b.left + b.width / 2, nowY = b.top + b.height / 2;
      var best = null, bestScore = -1;

      for (var i = 0; i < 24; i++) {
        var x = Math.random() * maxX;
        var y = Math.random() * maxY;
        var left = a.left + x, top = a.top + y;

        // никогда не приземляемся на «Да»
        if (left - gap < yb.right && left + b.width + gap > yb.left &&
            top - gap < yb.bottom && top + b.height + gap > yb.top) continue;

        var cx = left + b.width / 2, cy = top + b.height / 2;
        var score = Math.hypot(cx - nowX, cy - nowY) +
                    Math.hypot(cx - (yb.left + yb.width / 2), cy - (yb.top + yb.height / 2)) * 1.4;
        if (score > bestScore) { bestScore = score; best = { x: x, y: y }; }
      }

      if (!best) best = { x: nowX > a.left + a.width / 2 ? 0 : maxX,
                          y: nowY > a.top + a.height / 2 ? 0 : maxY };

      setPos(best.x, best.y, .38);

      dodges++;
      if (hasGSAP && !reduced) {
        gsap.to(yes, { scale: Math.min(1 + dodges * 0.07, 1.4), duration: .5, ease: "back.out(2)" });
      }
    }

    if (canHover) no.addEventListener("mouseenter", dodge);
    no.addEventListener("focus", dodge);
    no.addEventListener("touchstart", function (e) { e.preventDefault(); dodge(); }, { passive: false });
    no.addEventListener("click", function (e) { e.preventDefault(); dodge(); });

    // «Да» ведёт туда же, куда и раньше
    yes.addEventListener("click", function () {
      yes.disabled = true;
      window.location.href = "yes.html";
    });
  }

  // осталось глобальным: раньше вызывалось из inline onclick
  window.nextPage = function () { window.location.href = "yes.html"; };

  /* ----------------------------------------------------------
     Кнопка «листай вниз»
     ---------------------------------------------------------- */
  function setupScrollCue() {
    document.querySelectorAll("[data-scroll-to]").forEach(function (el) {
      el.addEventListener("click", function () {
        var t = document.querySelector(el.getAttribute("data-scroll-to"));
        if (t) t.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      });
    });
  }

  /* ----------------------------------------------------------
     yes.html — конфетти
     ---------------------------------------------------------- */
  function setupConfetti() {
    var canvas = document.getElementById("confetti-canvas");
    if (!canvas || reduced || typeof ConfettiGenerator === "undefined") return;

    // confetti-js ищет цель через getElementById, поэтому нужна
    // строка-id, а не сам элемент
    var confetti = new ConfettiGenerator({
      target: "confetti-canvas",
      width: window.innerWidth,
      height: window.innerHeight,
      max: window.innerWidth < 600 ? 90 : 150,
      size: 1.4,
      animate: true,
      props: ["circle", "square", "triangle", "line"],
      colors: [[232, 40, 79], [168, 20, 58], [59, 10, 27], [240, 210, 201]],
      clock: 25,
      rotate: true,
      start_from_edge: true,
      respawn: true
    });
    confetti.render();
    setTimeout(function () { confetti.clear(); }, 9000);
  }

  /* ---------------------------------------------------------- */
  function init() {
    applyDeviceCopy();
    setupGifts();
    setupScrollCue();
    setupChoice();
    customCursor();
    inkDrift();
    setupConfetti();
    playLoader(buildScenes);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
