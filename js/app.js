(function(){
  "use strict";

  var APP = document.getElementById("app");
  var NAV_DOC_TITLE = document.getElementById("navDocTitle");
  var LESSON_TABS = document.getElementById("lessonTabs");
  var SCROLL_BTN = document.getElementById("scrollTopBtn");

  var DEFAULT_MANIFEST = "lessons.json";

  function qs(name){
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function escapeHtml(s){
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  function renderError(title, detail){
    APP.innerHTML =
      '<div class="state-screen">' +
        '<h2>' + escapeHtml(title) + '</h2>' +
        '<p>' + detail + '</p>' +
      '</div>';
  }

  function fetchText(path){
    return fetch(path, {cache:"no-cache"}).then(function(res){
      if(!res.ok){ throw new Error("HTTP " + res.status); }
      return res.text();
    });
  }

  function loadManifest(){
    return fetchText(DEFAULT_MANIFEST)
      .then(function(txt){
        try{ return JSON.parse(txt); }
        catch(e){ return {lessons:[]}; }
      })
      .catch(function(){ return {lessons:[]}; });
  }

  function buildTabs(lessons, activeFile){
    if(!lessons || lessons.length < 2){
      LESSON_TABS.style.display = "none";
      LESSON_TABS.innerHTML = "";
      return;
    }
    LESSON_TABS.style.display = "flex";
    LESSON_TABS.innerHTML = lessons.map(function(l){
      var cls = "lesson-tab" + (l.file === activeFile ? " is-active" : "");
      return '<button class="' + cls + '" data-file="' + escapeHtml(l.file) + '" type="button">' +
        escapeHtml(l.label || l.file) + '</button>';
    }).join("");

    Array.prototype.forEach.call(LESSON_TABS.querySelectorAll(".lesson-tab"), function(btn){
      btn.addEventListener("click", function(){
        var f = btn.getAttribute("data-file");
        var url = new URL(window.location.href);
        url.searchParams.set("doc", f);
        window.location.href = url.toString();
      });
    });
  }

  // split off the first two bold-only lines as hero title/subtitle if the
  // document follows the "**제목**" / "**부제**" convention used by the
  // lesson template. falls back gracefully if the pattern is not found.
  function extractHero(mdText, fallbackTitle){
    var lines = mdText.split("\n");
    var i = 0;
    while(i < lines.length && lines[i].trim() === "") i++;

    var titleMatch = i < lines.length ? lines[i].match(/^\*\*(.+)\*\*$/) : null;
    if(!titleMatch){
      return {title: fallbackTitle, subtitle: "", bodyStart: 0};
    }
    var title = titleMatch[1];
    var j = i + 1;
    var subtitle = "";
    if(j < lines.length){
      var subMatch = lines[j].match(/^\*\*(.+)\*\*$/);
      if(subMatch){ subtitle = subMatch[1]; j++; }
    }
    return {title: title, subtitle: subtitle, bodyStart: j};
  }

  function slugify(text, index){
    return "sec-" + index;
  }

  // single-pass tokenizer: matches comments / strings / numbers / keywords
  // against the ORIGINAL escaped source only, so inserted <span> markup is
  // never re-scanned by a later rule (which would corrupt the HTML).
  var PY_TOKEN_RE = /(#[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|\b(\d+\.?\d*)\b|\b(import|from|as|def|class|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|try|except|finally|with|lambda|yield|break|continue|pass|global|self)\b/g;

  function highlightPython(code){
    var escaped = escapeHtml(code);
    return escaped.replace(PY_TOKEN_RE, function(m, comment, str, num, kw){
      if(comment !== undefined) return '<span class="tok-com">' + comment + '</span>';
      if(str !== undefined) return '<span class="tok-str">' + str + '</span>';
      if(num !== undefined) return '<span class="tok-num">' + num + '</span>';
      if(kw !== undefined) return '<span class="tok-kw">' + kw + '</span>';
      return m;
    });
  }

  function enhance(container){
    // heading ids + toc data
    var headings = container.querySelectorAll("h2, h3");
    var tocEntries = [];
    headings.forEach(function(h, idx){
      var originalText = h.textContent;
      var id = slugify(originalText, idx);
      h.id = id;
      var isH2 = h.tagName === "H2";
      if(isH2){
        var m = originalText.match(/^(\d+)\.\s+(.+)$/);
        if(m){
          h.innerHTML = '<span class="h2-badge">' + m[1] + '</span><span>' + escapeHtml(m[2]) + '</span>';
        }
      }
      tocEntries.push({id:id, text:originalText, level: isH2 ? 2 : 3});
    });

    // blockquotes -> callouts
    var quotes = container.querySelectorAll("blockquote");
    quotes.forEach(function(bq, idx){
      bq.classList.add("callout-" + (idx % 3));
    });

    // tables -> scroll wrap
    var tables = container.querySelectorAll("table");
    tables.forEach(function(t){
      var wrap = document.createElement("div");
      wrap.className = "table-wrap";
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
    });

    // label lines: **예제 코드**: ... / **실행 결과**
    var paras = container.querySelectorAll("p");
    paras.forEach(function(p){
      var strong = p.querySelector("strong");
      if(!strong || p.firstElementChild !== strong) return;
      var label = strong.textContent.trim();
      if(label === "예제 코드" || label === "실행 결과"){
        p.classList.add("label-line");
        if(label === "실행 결과"){ p.classList.add("label-result"); }
        strong.classList.add("label-badge");
      }
    });

    // code blocks
    var pres = container.querySelectorAll("pre > code");
    pres.forEach(function(codeEl){
      var pre = codeEl.parentElement;
      var langClass = Array.prototype.find.call(codeEl.classList, function(c){ return c.indexOf("language-") === 0; });
      var lang = langClass ? langClass.replace("language-","") : "text";
      var raw = codeEl.textContent;

      if(lang === "python" || lang === "py"){
        codeEl.innerHTML = highlightPython(raw);
      }

      var wrap = document.createElement("div");
      wrap.className = "code-block";
      var bar = document.createElement("div");
      bar.className = "code-block__bar";
      bar.innerHTML = '<span class="code-block__lang">' + escapeHtml(lang) + '</span>' +
        '<button class="code-copy" type="button">복사</button>';
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(bar);
      wrap.appendChild(pre);

      bar.querySelector(".code-copy").addEventListener("click", function(){
        navigator.clipboard.writeText(raw).then(function(){
          var btn = bar.querySelector(".code-copy");
          var original = btn.textContent;
          btn.textContent = "복사됨";
          setTimeout(function(){ btn.textContent = original; }, 1200);
        }).catch(function(){});
      });
    });

    return tocEntries;
  }

  // strip a heading's own leading numbering ("1. ", "①") before showing it
  // as a pill label, since the pill bar applies its own sequential 00, 01...
  var LEADING_NUMBER_RE = /^(\d+\.\s+|[①②③④⑤⑥⑦⑧⑨⑩]\s*)/;

  function buildTocBar(entries, labelText){
    if(!entries.length) return "";
    var pills = entries.map(function(e, idx){
      var clean = e.text.replace(LEADING_NUMBER_RE, "");
      var num = idx < 10 ? "0" + idx : String(idx);
      var cls = "toc-pill" + (e.level === 3 ? " toc-pill--sub" : "");
      return '<a class="' + cls + '" data-target="' + e.id + '" href="#' + e.id + '">' +
        escapeHtml(num + ". " + clean) + '</a>';
    }).join("");

    return '<div class="toc-bar__label">' + escapeHtml(labelText) + ' — 세부 목차</div>' +
      '<div class="toc-bar__pills">' + pills + '</div>';
  }

  function wireTocBar(barEl){
    var links = barEl.querySelectorAll(".toc-pill");
    var map = {};
    links.forEach(function(l){ map[l.getAttribute("data-target")] = l; });

    var headings = document.querySelectorAll(".doc h2, .doc h3");
    if(!headings.length || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var link = map[entry.target.id];
        if(!link) return;
        if(entry.isIntersecting){
          links.forEach(function(l){ l.classList.remove("is-active"); });
          link.classList.add("is-active");
        }
      });
    }, {rootMargin: "-100px 0px -70% 0px"});

    headings.forEach(function(h){ observer.observe(h); });
  }

  function render(mdText, meta){
    var hero = extractHero(mdText, meta.label || meta.file);
    var bodyLines = mdText.split("\n").slice(hero.bodyStart);
    var bodyMd = bodyLines.join("\n");

    var rawHtml = marked.parse(bodyMd, {gfm:true, breaks:false});
    var cleanHtml = window.DOMPurify ? DOMPurify.sanitize(rawHtml, {ADD_ATTR:["target"]}) : rawHtml;

    document.title = hero.title + " · 웹 교안";
    NAV_DOC_TITLE.textContent = hero.title;

    APP.innerHTML =
      '<div class="layout">' +
        '<nav class="toc-bar" id="tocBar"></nav>' +
        '<main class="content-card"><article class="doc" id="docBody"></article></main>' +
      '</div>' +
      '<footer class="site-footer">' +
        '<div>' + escapeHtml(meta.footer || "") + '</div>' +
        '<div class="note">이 페이지는 <code>' + escapeHtml(meta.file) + '</code> 파일을 매번 새로 불러와 표시합니다. 마크다운 원본을 수정하면 새로고침만으로 반영됩니다.</div>' +
      '</footer>';

    var docBody = document.getElementById("docBody");
    docBody.innerHTML = cleanHtml;
    var tocEntries = enhance(docBody);
    var tocBar = document.getElementById("tocBar");
    tocBar.innerHTML = buildTocBar(tocEntries, meta.label || hero.title);
    wireTocBar(tocBar);
  }

  function boot(){
    loadManifest().then(function(manifest){
      var lessons = manifest.lessons || [];
      var requested = qs("doc");
      var target = requested ||
        (lessons[0] && lessons[0].file) ||
        "ch532_신경망심층학습.md";

      buildTabs(lessons, target);

      var meta = lessons.find(function(l){ return l.file === target; }) || {file: target, label: target};
      meta.footer = "(주)KD 아카데미 | 훈련교사 김명철 · AI 특화 인재양성 과정";

      fetchText(target)
        .then(function(mdText){ render(mdText, meta); })
        .catch(function(err){
          renderError(
            "마크다운 파일을 불러오지 못했습니다",
            "<code>" + escapeHtml(target) + "</code> 파일을 찾을 수 없거나 이 페이지를 <code>file://</code>로 직접 열었을 가능성이 있습니다.<br>" +
            "GitHub Pages로 배포한 주소로 접속하거나, 로컬에서는 간이 서버(예: <code>python -m http.server</code>)를 통해 열어주세요.<br>" +
            "오류 내용: " + escapeHtml(err.message)
          );
        });
    });
  }

  window.addEventListener("scroll", function(){
    if(window.scrollY > 480){ SCROLL_BTN.classList.add("is-visible"); }
    else{ SCROLL_BTN.classList.remove("is-visible"); }
  });
  SCROLL_BTN.addEventListener("click", function(){
    window.scrollTo({top:0, behavior:"smooth"});
  });

  boot();
})();
