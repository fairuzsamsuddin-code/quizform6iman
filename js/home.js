(function () {
  var order = [
    ["ekonomi", "A"], ["bm", "B"], ["sejarah", "C"], ["pengajianam", "D"], ["muet", "E"]
  ];
  var list = document.getElementById("subjects");
  var best = {};
  try { best = JSON.parse(localStorage.getItem("uciman.best") || "{}"); } catch (e) {}

  order.forEach(function (o) {
    var d = window.QUIZ_DATA[o[0]];
    if (!d) return;
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.className = "subject";
    a.href = "quiz.html?subject=" + o[0];
    var b = best[o[0]];
    a.innerHTML =
      '<span class="bubble" aria-hidden="true">' + o[1] + '</span>' +
      '<span class="meta"><h2></h2><div class="code"></div></span>' +
      '<span class="side"><strong></strong></span>';
    a.querySelector("h2").textContent = d.title;
    a.querySelector(".code").textContent = d.code;
    a.querySelector("strong").textContent = d.questions.length + " soalan";
    var side = a.querySelector(".side");
    side.appendChild(document.createTextNode(b ? "Terbaik: " + b.score + "/40 (" + b.pct + "%)" : "40 soalan setiap sesi"));
    li.appendChild(a);
    list.appendChild(li);
  });
})();
