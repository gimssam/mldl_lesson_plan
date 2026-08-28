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

  // strip the leading "**title**" / "**subtitle**" hero lines exactly like
  // app.js's extractHero(), so the remaining body — and therefore the h2/h3
  // walk below — starts at the same line, giving the same "sec-N" ids the
  // lesson viewer assigns.
  function stripHero(mdText){
    var lines = mdText.split("\n");
    var i = 0;
    while(i < lines.length && lines[i].trim() === "") i++;
    if(i >= lines.length || !/^\*\*(.+)\*\*$/.test(lines[i])) return mdText;
    var j = i + 1;
    if(j < lines.length && /^\*\*(.+)\*\*$/.test(lines[j])) j++;
    return lines.slice(j).join("\n");
  }

  var LEADING_NUMBER_RE = /^(\d+\.\s+|[①②③④⑤⑥⑦⑧⑨⑩]\s*)/;

  // same hierarchical numbering as buildTocBar() in app.js: h2 gets a
  // sequential 00, 01, ...; a h3 is numbered relative to the h2 before it
  // ("03-1", "03-2", ...) so a section listed here matches the pill it
  // opens to on the lesson page.
  function extractHeadings(mdText){
    var bodyMd = stripHero(mdText);
    var rawHtml = marked.parse(bodyMd, {gfm:true, breaks:false});
    var cleanHtml = window.DOMPurify ? DOMPurify.sanitize(rawHtml) : rawHtml;
    var container = document.createElement("div");
    container.innerHTML = cleanHtml;

    var headings = container.querySelectorAll("h2, h3");
    var h2Index = -1, subIndex = 0;
    var items = [];
    headings.forEach(function(h, idx){
      var text = h.textContent;
      var clean = text.replace(LEADING_NUMBER_RE, "");
      var isH2 = h.tagName === "H2";
      var num;
      if(isH2){
        h2Index += 1;
        subIndex = 0;
        num = pad2(h2Index);
      } else {
        subIndex += 1;
        var parent = h2Index < 0 ? 0 : h2Index;
        num = pad2(parent) + "-" + subIndex;
      }
      items.push({id: "sec-" + idx, level: isH2 ? 2 : 3, num: num, text: clean});
    });
    return items;
  }

  function buildBlock(lesson, index, items){
    var href = "lesson.html?doc=" + encodeURIComponent(lesson.file);
    var listHtml;
    if(items.length){
      listHtml = '<ul class="course-block__list">' + items.map(function(it){
        var cls = "course-block__item" + (it.level === 3 ? " course-block__item--sub" : "");
        return '<li class="' + cls + '"><a href="' + href + '#' + it.id + '">' +
          escapeHtml(it.num + '. ' + it.text) + '</a></li>';
      }).join("") + '</ul>';
    } else {
      listHtml = '<p class="course-block__empty">목차 정보를 불러오지 못했습니다.</p>';
    }

    return '<section class="course-block">' +
      '<div class="course-block__eyebrow">제' + (index + 1) + '절</div>' +
      '<h2 class="course-block__title"><a href="' + href + '">' + escapeHtml(lesson.label || lesson.file) + '</a></h2>' +
      '<div class="course-block__file">' + escapeHtml(lesson.file) + '</div>' +
      listHtml +
    '</section>';
  }

  function renderLessons(lessons){
    if(!lessons.length){
      renderEmpty("등록된 교안이 없습니다. lessons.json에 절을 추가해주세요.");
      return;
    }
    if(COUNT){ COUNT.textContent = "전체 " + lessons.length + "개 절"; }

    var fetches = lessons.map(function(l){
      return fetch(l.file, {cache:"no-cache"})
        .then(function(res){ if(!res.ok){ throw new Error("HTTP " + res.status); } return res.text(); })
        .catch(function(){ return ""; });
    });

    Promise.all(fetches).then(function(mdTexts){
      var html = lessons.map(function(l, idx){
        var items = mdTexts[idx] ? extractHeadings(mdTexts[idx]) : [];
        return buildBlock(l, idx, items);
      }).join("");
      GRID.innerHTML = html;
    });
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
