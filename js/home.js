(function(){
  "use strict";

  var GRID = document.getElementById("lessonGrid");
  var COUNT = document.getElementById("lessonCount");

  function escapeHtml(s){
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  function pad2(n){
    return n < 10 ? "0" + n : String(n);
  }

  function renderEmpty(message){
    GRID.innerHTML = '<div class="state-screen"><h2>' + escapeHtml(message) + '</h2></div>';
  }

  function renderLessons(lessons){
    if(!lessons.length){
      renderEmpty("등록된 교안이 없습니다. lessons.json에 절을 추가해주세요.");
      return;
    }

    if(COUNT){ COUNT.textContent = "전체 " + lessons.length + "개 절"; }

    GRID.innerHTML = lessons.map(function(l, idx){
      return '<a class="lesson-card" href="lesson.html?doc=' + encodeURIComponent(l.file) + '">' +
        '<span class="lesson-card__num">' + pad2(idx + 1) + '</span>' +
        '<span class="lesson-card__body">' +
          '<span class="lesson-card__label">' + escapeHtml(l.label || l.file) + '</span>' +
          '<span class="lesson-card__file">' + escapeHtml(l.file) + '</span>' +
        '</span>' +
        '<span class="lesson-card__arrow" aria-hidden="true">→</span>' +
      '</a>';
    }).join("");
  }

  fetch("lessons.json", {cache:"no-cache"})
    .then(function(res){
      if(!res.ok){ throw new Error("HTTP " + res.status); }
      return res.json();
    })
    .then(function(data){
      renderLessons(data.lessons || []);
    })
    .catch(function(err){
      renderEmpty("lessons.json을 불러오지 못했습니다: " + err.message);
    });
})();
