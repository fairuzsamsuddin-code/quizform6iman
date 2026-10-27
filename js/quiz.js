(function () {
  var SESSION_SIZE = 40;
  var FILES = {
    ekonomi: "data/ekonomi.js",
    bm: "data/bm.js",
    sejarah: "data/sejarah.js",
    pengajianam: "data/pengajianam.js",
    muet: "data/muet.js"
  };
  var LETTERS = ["A", "B", "C", "D"];
  var app = document.getElementById("app");
  var key = new URLSearchParams(location.search).get("subject");

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  if (!key || !FILES[key]) {
    app.innerHTML = "";
    var err = el("div", "error");
    err.appendChild(el("h1", null, "Subjek tidak dijumpai"));
    err.appendChild(el("p", null, "Pilih salah satu subjek dari halaman utama."));
    var back = el("a", "btn", "Kembali ke senarai subjek");
    back.href = "index.html";
    err.appendChild(back);
    app.appendChild(err);
    return;
  }

  var s = document.createElement("script");
  s.src = FILES[key];
  s.onload = function () { start(window.QUIZ_DATA[key]); };
  s.onerror = function () { app.textContent = "Gagal memuatkan soalan. Muat semula halaman ini."; };
  document.head.appendChild(s);

  var data, session, idx, answers, score, locked;
  var ms; // bahasa antara muka

  function pickSession() {
    var all = data.questions.map(function (q, i) { return i; });
    var seenKey = "uciman.seen." + key;
    var seen = store(seenKey) || [];
    var fresh = all.filter(function (i) { return seen.indexOf(i) < 0; });
    var chosen;
    if (fresh.length >= SESSION_SIZE) {
      chosen = shuffle(fresh).slice(0, SESSION_SIZE);
      seen = seen.concat(chosen);
    } else {
      // soalan baharu tidak mencukupi: ambil semua yang belum dilihat, lengkapkan daripada yang lain, kemudian mulakan pusingan baharu
      var rest = shuffle(all.filter(function (i) { return fresh.indexOf(i) < 0; }));
      chosen = fresh.concat(rest.slice(0, SESSION_SIZE - fresh.length));
      seen = chosen.slice();
    }
    store(seenKey, seen);
    return shuffle(chosen).map(function (i) {
      var q = data.questions[i];
      var opts = shuffle([
        { t: q[2], ok: true }, { t: q[3], ok: false }, { t: q[4], ok: false }, { t: q[5], ok: false }
      ]);
      return { topic: q[0], text: q[1], opts: opts };
    });
  }

  function start(d) {
    data = d;
    document.title = d.title + " | Ujian Cubaan Semester 1 Iman Arissa";
    document.documentElement.lang = d.lang === "en" ? "ms" : "ms";
    session = pickSession();
    idx = 0; score = 0; locked = false;
    answers = [];
    render();
  }

  function header() {
    var top = el("div", "topbar");
    var a = el("a", "back", "← Semua subjek");
    a.href = "index.html";
    top.appendChild(a);
    top.appendChild(el("div", "who", "Iman Arissa"));
    var box = el("div");
    box.appendChild(top);
    var t = el("h1", "qtitle", data.title);
    box.appendChild(t);
    box.appendChild(el("div", "qcode", data.code));
    return box;
  }

  function strip() {
    var s = el("div", "strip");
    s.setAttribute("role", "img");
    s.setAttribute("aria-label", "Kemajuan: soalan " + (idx + 1) + " daripada " + session.length);
    session.forEach(function (_, i) {
      var b = el("i");
      if (answers[i] === true) b.className = "right";
      else if (answers[i] === false) b.className = "wrong";
      else if (i === idx) b.className = "now";
      s.appendChild(b);
    });
    return s;
  }

  function render() {
    app.innerHTML = "";
    app.appendChild(header());
    app.appendChild(strip());

    var q = session[idx];
    var c = el("div", "counter");
    c.appendChild(el("span", null, "Soalan " + (idx + 1) + " / " + session.length));
    c.appendChild(el("span", "topic", q.topic));
    app.appendChild(c);

    var card = el("div", "card");
    var qt = el("p", "question", q.text);
    qt.id = "qtext";
    card.appendChild(qt);

    var ul = el("ul", "options");
    ul.setAttribute("role", "group");
    ul.setAttribute("aria-labelledby", "qtext");
    q.opts.forEach(function (o, i) {
      var li = el("li");
      var b = el("button", "option");
      b.type = "button";
      var bub = el("span", "bubble", LETTERS[i]);
      bub.setAttribute("aria-hidden", "true");
      b.appendChild(bub);
      b.appendChild(el("span", "txt", o.t));
      b.addEventListener("click", function () { choose(i); });
      li.appendChild(b);
      ul.appendChild(li);
    });
    card.appendChild(ul);

    var fb = el("p", "feedback");
    fb.id = "fb";
    fb.setAttribute("role", "status");
    card.appendChild(fb);
    app.appendChild(card);

    var act = el("div", "actions");
    var next = el("button", "btn", idx === session.length - 1 ? "Lihat keputusan" : "Soalan seterusnya");
    next.type = "button";
    next.id = "next";
    next.disabled = true;
    next.addEventListener("click", advance);
    act.appendChild(next);
    app.appendChild(act);
    locked = false;
    window.scrollTo(0, 0);
  }

  function choose(i) {
    if (locked) return;
    locked = true;
    var q = session[idx];
    var ok = q.opts[i].ok;
    if (ok) score++;
    answers[idx] = ok;
    q.picked = i;
    var btns = app.querySelectorAll(".option");
    q.opts.forEach(function (o, j) {
      btns[j].disabled = true;
      if (o.ok) btns[j].classList.add("right");
      else if (j === i) btns[j].classList.add("wrong");
      if (j === i) btns[j].classList.add("picked");
    });
    var fb = document.getElementById("fb");
    if (ok) {
      fb.className = "feedback ok";
      fb.textContent = "Betul.";
    } else {
      fb.className = "feedback bad";
      fb.textContent = "Kurang tepat.";
      var correct = q.opts.filter(function (o) { return o.ok; })[0];
      fb.appendChild(el("span", null, "Jawapan betul: " + correct.t));
    }
    // kemas kini jalur kemajuan
    var old = app.querySelector(".strip");
    app.replaceChild(strip(), old);
    var n = document.getElementById("next");
    n.disabled = false;
    n.focus();
  }

  function advance() {
    if (!locked) return;
    if (idx < session.length - 1) { idx++; render(); } else { finish(); }
  }

  function verdict(p) {
    if (p >= 85) return "Cemerlang. Penguasaan anda kukuh untuk subjek ini.";
    if (p >= 70) return "Bagus. Semak semula soalan yang salah di bawah untuk mencapai tahap cemerlang.";
    if (p >= 50) return "Memuaskan. Baca semula bab yang markahnya rendah, kemudian cuba sesi baharu.";
    return "Perlu diperkukuh. Ulang kaji nota bagi bab di bawah dan cuba lagi.";
  }

  function finish() {
    var total = session.length;
    var pct = Math.round((score / total) * 1000) / 10;
    var pctText = (pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1));
    var best = store("uciman.best") || {};
    if (!best[key] || score > best[key].score) { best[key] = { score: score, pct: pctText }; store("uciman.best", best); }

    app.innerHTML = "";
    app.appendChild(header());
    var r = el("section", "result");
    r.setAttribute("aria-label", "Keputusan");
    var sc = el("div", "score");
    var big = el("div", "big");
    big.appendChild(document.createTextNode(score));
    big.appendChild(el("small", null, "/" + total));
    sc.appendChild(big);
    sc.appendChild(el("div", "pct", pctText + "%"));
    r.appendChild(sc);
    r.appendChild(el("p", "verdict", score + " daripada " + total + " soalan dijawab dengan betul. " + verdict(pct)));

    // pecahan mengikut topik
    var by = {};
    session.forEach(function (q, i) {
      by[q.topic] = by[q.topic] || { ok: 0, n: 0 };
      by[q.topic].n++;
      if (answers[i]) by[q.topic].ok++;
    });
    r.appendChild(el("h3", null, "Mengikut bab"));
    r.lastChild.style.marginTop = "28px";
    var tl = el("ul", "topics");
    Object.keys(by).forEach(function (t) {
      var li = el("li");
      li.appendChild(el("span", null, t));
      li.appendChild(el("span", null, by[t].ok + "/" + by[t].n));
      var bar = el("div", "bar");
      var fill = el("b");
      fill.style.width = Math.round((by[t].ok / by[t].n) * 100) + "%";
      bar.appendChild(fill);
      li.appendChild(bar);
      tl.appendChild(li);
    });
    r.appendChild(tl);

    // semakan jawapan salah
    var rv = el("div", "review");
    rv.appendChild(el("h3", null, "Semak soalan yang salah"));
    var wrong = session.filter(function (q, i) { return !answers[i]; });
    if (!wrong.length) {
      rv.appendChild(el("p", "empty", "Semua jawapan betul. Tiada soalan untuk disemak."));
    } else {
      var ol = el("ol");
      wrong.forEach(function (q) {
        var li = el("li");
        li.appendChild(el("p", null, q.text));
        li.appendChild(el("p", "yours", "Jawapan anda: " + q.opts[q.picked].t));
        li.appendChild(el("p", "right", "Jawapan betul: " + q.opts.filter(function (o) { return o.ok; })[0].t));
        ol.appendChild(li);
      });
      rv.appendChild(ol);
    }
    r.appendChild(rv);

    var act = el("div", "actions");
    var again = el("button", "btn", "Cuba lagi (40 soalan baharu)");
    again.type = "button";
    again.addEventListener("click", function () { start(data); });
    var home = el("a", "btn ghost", "Pilih subjek lain");
    home.href = "index.html";
    act.appendChild(again);
    act.appendChild(home);
    r.appendChild(act);
    app.appendChild(r);
    window.scrollTo(0, 0);
  }

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key.toLowerCase();
    var map = { a: 0, b: 1, c: 2, d: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
    if (!locked && map[k] !== undefined && app.querySelector(".option")) { choose(map[k]); }
  });
})();
