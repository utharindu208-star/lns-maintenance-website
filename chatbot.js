/* ============================================================
   LNS Maintenance Services — quote chatbot (vanilla JS, no deps)
   - Guided quote flow with optional photo upload
   - Answers FAQs about the business from a local knowledge base
   - Emails the enquiry + photos to the business via Web3Forms
   ============================================================

   >>> DELIVERY: enquiries (and photos) are emailed via Web3Forms to
   admin@lnsmaintenanceservices.com.au — the address the access key below is
   registered to. On the Web3Forms free plan mail goes ONLY to that registered
   address, so changing BUSINESS_EMAIL alone will NOT redirect enquiries; a new
   key must be generated from an account on the new address.
   If the key is ever cleared, the bot falls back to opening the visitor's email app.
*/
(function () {
  "use strict";

  var CONFIG = {
    WEB3FORMS_ACCESS_KEY: "3236d03d-584f-4f1d-80d7-b7963b5753cb", // Web3Forms key registered to admin@ — enquiries are delivered there
    BUSINESS_EMAIL: "admin@lnsmaintenanceservices.com.au",
    BUSINESS_PHONE_DISPLAY: "0424 120 509",
    BUSINESS_PHONE_TEL: "+61424120509",
    MAX_PHOTOS: 4,
    MAX_PHOTO_MB: 5,
  };

  var inSub = /\/(services|areas)\//.test(location.pathname);
  var LOGO = (inSub ? "../" : "") + "assets/lns-logo.png";

  var SUBURBS = ["Werribee 3030", "Wyndham Vale 3024", "Hoppers Crossing 3029", "Point Cook 3030", "Tarneit 3029", "Truganina 3029", "Williams Landing 3027", "Manor Lakes 3024", "Geelong 3220", "Ballarat 3350"];
  var SERVICES = ["End of Lease / Bond Clean", "House & Regular Cleaning", "Deep / Spring / Pre-Sale", "Carpet Cleaning", "Window Cleaning", "NDIS & Aged Care", "Office & Commercial", "Builders / Post-Construction", "Medical & Childcare", "Warehouse & Industrial", "Strata & Common Areas"];

  // ---- FAQ knowledge base (keyword match) ----
  var KB = [
    { k: ["area", "areas", "suburb", "where", "location", "cover", "servic", "werribee", "point cook", "hoppers", "tarneit", "truganina", "williams", "wyndham", "manor", "geelong", "ballarat", "melbourne", "near", "regional"], a: "We cover Melbourne's west — Werribee 3030, Wyndham Vale 3024, Hoppers Crossing 3029, Point Cook 3030, Tarneit 3029, Truganina 3029, Williams Landing 3027 and Manor Lakes 3024 — plus the regional cities of Geelong 3220 and Ballarat 3350." },
    { k: ["price", "prices", "cost", "how much", "quote", "rate", "charge", "expensive", "estimate", "$"], a: "Pricing is fixed-price and depends on the property size, condition and what's included. As a rough guide, a 2-bed unit bond clean is about $250–$380, and a 4-bed house with carpets about $480–$650. The best way is a fast, free quote — tap “Get a free quote” and I'll grab a few details." },
    { k: ["bond", "end of lease", "vacate", "exit clean", "moving out", "move out", "inspection", "guarantee"], a: "Yes — our end of lease cleans follow your agent's exit checklist and come with a bond-back re-clean guarantee: if your property manager flags a cleaning issue within 72 hours, we return and re-clean the affected areas free of charge." },
    { k: ["hour", "hours", "open", "weekend", "saturday", "sunday", "time", "what time", "public holiday"], a: "We're open 7 days a week, 7am–11pm, including weekends and public holidays." },
    { k: ["product", "products", "eco", "chemical", "safe", "pet", "pets", "child", "children", "kid", "allergy", "allergies", "sensitiv", "fragrance"], a: "We use eco-friendly, low-toxicity products as standard, and can go fragrance-free / low-VOC for homes with kids, pets, allergies or NDIS/aged-care needs. Just mention it when booking." },
    { k: ["carpet", "steam", "dry", "stain", "odour", "odor", "pet smell"], a: "Yes — we steam clean carpets with hot-water extraction that lifts stains, dirt, allergens and pet odours. Most carpets are walkable within 2–4 hours." },
    { k: ["ndis", "aged care", "disability", "plan manage", "support coordinator"], a: "Yes — we clean for NDIS participants whose plans include household cleaning under Assistance with Daily Life, with itemised plan-friendly invoicing and consistent, vetted cleaners." },
    { k: ["insure", "insured", "insurance", "police", "vetted", "trust", "trusted", "certificate", "liability", "background"], a: "Our cleaners are vetted before working with us and we carry public liability insurance. Facility managers and NDIS plan managers can request our certificate of currency at " + CONFIG.BUSINESS_EMAIL + "." },
    { k: ["bring", "equipment", "supplies", "provide", "gear", "vacuum", "own product"], a: "No need to provide anything — our team arrives fully equipped with all products, cloths, mops, vacuums and steam gear. Tell us if you'd prefer a specific product." },
    { k: ["service", "services", "what do you", "offer", "do you do", "clean what", "list"], a: "We offer 11 services across residential and commercial: end of lease/bond, house & regular, deep/spring/pre-sale, carpet, window, NDIS & aged care, office & commercial, builders/post-construction, medical & childcare, warehouse & industrial, and strata cleaning." },
    { k: ["book", "booking", "available", "how soon", "today", "tomorrow", "this week", "appointment", "schedule"], a: "We book 7 days a week. Regular house, carpet and office cleans are often available same or next day; for end of lease cleans we suggest booking 3–5 days ahead. Want me to start a quote?" },
    { k: ["office", "commercial", "business", "warehouse", "industrial", "strata", "shop", "retail"], a: "Yes — we do commercial cleaning including offices, retail, medical & childcare, warehouse/industrial and strata common areas, with after-hours options within our 7am–11pm window." },
    { k: ["deep clean", "spring clean", "one off", "once off", "pre-sale", "presale", "open home"], a: "A deep/spring clean is a top-to-bottom reset of a home you're staying in (ovens, grout, behind furniture, fans). It's also ideal as a pre-sale clean before an open home." },
    { k: ["builder", "construction", "renovation", "new build", "handover"], a: "Yes — our builders clean removes fine dust, debris, adhesive and paint spots, finishes sealant/silicone, polishes fixtures and does a first-clean of glazing, leaving a new build or reno handover-ready." },
    { k: ["thank", "thanks", "cheers", "ta ", "appreciate"], a: "You're welcome! Anything else I can help with?" },
    { k: ["hi", "hello", "hey", "good morning", "good afternoon", "g'day"], a: "Hi there! I can answer questions about our cleaning services, or help you get a fast, free quote. What would you like to do?" },
    { k: ["human", "call", "phone", "speak", "talk", "person", "contact", "number", "ring", "email"], a: "You can reach the team directly on <a href=\"tel:" + CONFIG.BUSINESS_PHONE_TEL + "\">" + CONFIG.BUSINESS_PHONE_DISPLAY + "</a> or email <a href=\"mailto:" + CONFIG.BUSINESS_EMAIL + "\">" + CONFIG.BUSINESS_EMAIL + "</a>. I can also take your details right here — tap “Get a free quote”." },
  ];

  // ---- SVG icons ----
  var IC = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    clip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
  };

  // ---- Build DOM ----
  var root = document.createElement("div");
  root.className = "lns-chat";
  root.innerHTML =
    '<button class="lns-chat-launch" aria-label="Open chat to get a quote">' + IC.chat + '<span class="lbl">Chat / Get a quote</span></button>' +
    '<section class="lns-chat-panel" role="dialog" aria-label="LNS Maintenance chat">' +
      '<header class="lns-chat-head">' +
        '<img src="' + LOGO + '" alt="LNS Maintenance" />' +
        '<div><div class="ht">LNS Maintenance</div><div class="hs"><span class="dot"></span>Typically replies within 1 business day</div></div>' +
        '<button class="close" aria-label="Close chat">' + IC.close + '</button>' +
      '</header>' +
      '<div class="lns-chat-body" id="lnsBody"></div>' +
      '<div class="lns-chat-foot">' +
        '<div class="lns-files" id="lnsFiles"></div>' +
        '<div class="lns-input-row">' +
          '<button class="lns-attach" id="lnsAttach" title="Attach photos" style="display:none">' + IC.clip + '</button>' +
          '<input type="text" id="lnsInput" placeholder="Type a message…" autocomplete="off" />' +
          '<button class="lns-send" id="lnsSend" aria-label="Send">' + IC.send + '</button>' +
        '</div>' +
        '<div class="lns-foot-note">Powered by LNS Maintenance · we’ll never share your details</div>' +
      '</div>' +
      '<input type="file" id="lnsFile" accept="image/*" multiple style="display:none" />' +
    '</section>';
  document.body.appendChild(root);

  var launch = root.querySelector(".lns-chat-launch");
  var panel = root.querySelector(".lns-chat-panel");
  var body = root.querySelector("#lnsBody");
  var input = root.querySelector("#lnsInput");
  var sendBtn = root.querySelector("#lnsSend");
  var attachBtn = root.querySelector("#lnsAttach");
  var fileInput = root.querySelector("#lnsFile");
  var filesBar = root.querySelector("#lnsFiles");

  var data = { transcript: [], photos: [] };
  var textHandler = null;   // function(value) for the next text submit
  var started = false;

  // ---- helpers ----
  function scroll() { body.scrollTop = body.scrollHeight; }
  function logT(role, text) { data.transcript.push((role === "bot" ? "LNS" : "You") + ": " + text.replace(/<[^>]+>/g, "")); }

  function addBubble(role, html) {
    var d = document.createElement("div");
    d.className = "lns-msg " + role;
    d.innerHTML = html;
    body.appendChild(d); scroll(); return d;
  }
  function userSay(text) { addBubble("user", escapeHtml(text)); logT("user", text); }

  function botSay(html, then) {
    var t = document.createElement("div");
    t.className = "lns-typing"; t.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(t); scroll();
    var delay = Math.min(900, 350 + html.length * 8);
    setTimeout(function () {
      t.remove(); addBubble("bot", html); logT("bot", html);
      if (then) then();
    }, delay);
  }

  function clearQuick() { var q = body.querySelector(".lns-quick.active"); if (q) q.remove(); }
  function quick(options, handler) {
    clearQuick();
    var wrap = document.createElement("div");
    wrap.className = "lns-quick active";
    options.forEach(function (opt) {
      var label = typeof opt === "string" ? opt : opt.label;
      var b = document.createElement("button");
      b.type = "button"; b.textContent = label;
      b.onclick = function () { wrap.remove(); handler(opt); };
      wrap.appendChild(b);
    });
    body.appendChild(wrap); scroll();
  }

  function ask(promptHtml, handler, opts) {
    opts = opts || {};
    textHandler = null;
    botSay(promptHtml, function () {
      input.type = opts.type || "text";
      input.placeholder = opts.placeholder || "Type your answer…";
      input.disabled = false;
      textHandler = function (val) { handler(val); };
      input.focus();
    });
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function digits(s) { return (s.match(/\d/g) || []).length; }
  function validEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim()); }

  // ---- input wiring ----
  function submitText() {
    var val = input.value.trim();
    if (!val) return;
    input.value = "";
    if (textHandler) { var h = textHandler; textHandler = null; userSay(val); h(val); }
  }
  sendBtn.onclick = submitText;
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submitText(); } });

  attachBtn.onclick = function () { fileInput.click(); };
  fileInput.onchange = function () {
    Array.prototype.forEach.call(fileInput.files, function (f) {
      if (data.photos.length >= CONFIG.MAX_PHOTOS) return;
      if (!/^image\//.test(f.type)) return;
      if (f.size > CONFIG.MAX_PHOTO_MB * 1024 * 1024) { addBubble("bot", "“" + escapeHtml(f.name) + "” is over " + CONFIG.MAX_PHOTO_MB + "MB, so I skipped it."); return; }
      data.photos.push(f);
    });
    fileInput.value = "";
    renderFiles();
  };
  function renderFiles() {
    filesBar.innerHTML = "";
    data.photos.forEach(function (f, i) {
      var chip = document.createElement("span");
      chip.className = "lns-file-chip";
      chip.innerHTML = "📎 " + escapeHtml(f.name.length > 18 ? f.name.slice(0, 16) + "…" : f.name) + ' <button aria-label="Remove">×</button>';
      chip.querySelector("button").onclick = function () { data.photos.splice(i, 1); renderFiles(); };
      filesBar.appendChild(chip);
    });
  }
  function showAttach(on) { attachBtn.style.display = on ? "flex" : "none"; }

  // ---- open / close ----
  function openChat() {
    panel.classList.add("open"); launch.classList.add("hide");
    if (!started) { started = true; showMenu(); }
    else input.focus();
  }
  function closeChat() { panel.classList.remove("open"); launch.classList.remove("hide"); }
  launch.onclick = openChat;
  root.querySelector(".lns-chat-head .close").onclick = closeChat;

  // ---- conversation ----
  function showMenu() {
    input.disabled = true; input.placeholder = "Choose an option above…";
    botSay("Hi! 👋 I'm the LNS Maintenance assistant. I can give you a fast, free cleaning quote or answer any questions about our services. How can I help?", function () {
      quick(["🧹 Get a free quote", "💬 Ask a question"], function (choice) {
        userSay(choice);
        if (choice.indexOf("quote") > -1) startQuote(); else startFAQ();
      });
    });
  }

  // FAQ mode
  function startFAQ() {
    botSay("Sure — ask me anything about our cleaning services, pricing, service areas, hours or guarantees.", function () {
      input.disabled = false; input.placeholder = "Ask a question…"; input.focus();
      textHandler = answerFAQ;
    });
  }
  function answerFAQ(q) {
    var t = q.toLowerCase(), best = null, bestScore = 0;
    KB.forEach(function (e) {
      var score = 0; e.k.forEach(function (k) { if (t.indexOf(k) > -1) score++; });
      if (score > bestScore) { bestScore = score; best = e; }
    });
    var answer = bestScore > 0 ? best.a : "Good question — I'm not totally sure on that one. The team can help directly on <a href=\"tel:" + CONFIG.BUSINESS_PHONE_TEL + "\">" + CONFIG.BUSINESS_PHONE_DISPLAY + "</a>, or I can take your details for a quote.";
    botSay(answer, function () {
      quick(["Ask another question", "🧹 Get a free quote"], function (c) {
        userSay(c);
        if (c.indexOf("quote") > -1) startQuote();
        else { botSay("Go ahead — what else would you like to know?", function () { input.focus(); textHandler = answerFAQ; }); }
      });
      input.disabled = false; textHandler = answerFAQ;
    });
  }

  // Quote flow
  function startQuote() {
    data.quote = {};
    qName();
  }
  function qName() {
    function handle(v) {
      if (v.length < 2) { ask("Sorry, could you tell me your name?", handle, { placeholder: "Your name" }); return; }
      data.quote.name = v; qPhone();
    }
    ask("Great — let's get you a quote. First up, what's your <strong>name</strong>?", handle, { placeholder: "Your name" });
  }
  function qPhone() {
    function handle(v) {
      if (digits(v) < 8) { ask("That doesn't look like a full number — what's the best phone number?", handle, { type: "tel", placeholder: "e.g. 0424 120 509" }); return; }
      data.quote.phone = v; qEmail();
    }
    ask("Thanks, " + escapeHtml(data.quote.name.split(" ")[0]) + "! What's the best <strong>phone number</strong> to reach you?", handle, { type: "tel", placeholder: "e.g. 0424 120 509" });
  }
  function qEmail() {
    function handle(v) {
      if (!validEmail(v)) { ask("Hmm, that email looks off — could you re-enter it?", handle, { type: "email", placeholder: "you@email.com" }); return; }
      data.quote.email = v; qSuburb();
    }
    ask("And your <strong>email</strong>? (so we can send your written quote)", handle, { type: "email", placeholder: "you@email.com" });
  }
  function qSuburb() {
    input.disabled = true; input.placeholder = "Pick your suburb above…";
    botSay("Which <strong>suburb</strong> is the job in?", function () {
      quick(SUBURBS.concat(["Another suburb"]), function (opt) {
        userSay(opt);
        if (opt === "Another suburb") {
          ask("No problem — which suburb and postcode?", function (v) { data.quote.suburb = v; qService(); }, { placeholder: "Suburb, postcode" });
        } else { data.quote.suburb = opt; qService(); }
      });
    });
  }
  function qService() {
    input.disabled = true;
    botSay("What would you like <strong>cleaned</strong>?", function () {
      quick(SERVICES.concat(["Something else"]), function (opt) {
        userSay(opt);
        if (opt === "Something else") {
          ask("Tell me what you need cleaned:", function (v) { data.quote.service = v; qProperty(); }, { placeholder: "What needs cleaning?" });
        } else { data.quote.service = opt; qProperty(); }
      });
    });
  }
  function qProperty() {
    input.disabled = true;
    botSay("What type of <strong>property</strong> is it?", function () {
      quick(["Apartment / Unit", "House", "Townhouse", "Office / Commercial", "Other"], function (opt) {
        userSay(opt); data.quote.property = opt; qSize();
      });
    });
  }
  function qSize() {
    input.disabled = true;
    botSay("Roughly how <strong>big</strong> is it?", function () {
      quick(["Studio / 1 bed", "2 bedrooms", "3 bedrooms", "4 bedrooms", "5+ bedrooms", "Commercial / N/A"], function (opt) {
        userSay(opt); data.quote.size = opt; qWhen();
      });
    });
  }
  function qWhen() {
    input.disabled = true;
    botSay("When do you <strong>need it done</strong>?", function () {
      quick(["As soon as possible", "Within a week", "Within a month", "Just getting a quote"], function (opt) {
        userSay(opt); data.quote.when = opt; qDetails();
      });
    });
  }
  function qDetails() {
    ask("Any <strong>details</strong> that help us quote accurately? (access, condition, specific rooms, parking…) — or tap Skip.", function (v) {
      data.quote.details = v; qPhotos();
    }, { placeholder: "Add any details (optional)" });
    quick(["Skip"], function () { userSay("(skipped)"); data.quote.details = ""; textHandler = null; qPhotos(); });
  }
  function qPhotos() {
    input.disabled = true; input.placeholder = "";
    showAttach(true);
    botSay("Want to add a few <strong>photos</strong> of what needs cleaning? It helps us give an accurate estimate. Tap the 📎 to attach, then Continue. (Optional)", function () {
      quick(["Continue", "No photos"], function (opt) {
        userSay(data.photos.length ? data.photos.length + " photo(s) attached" : "No photos");
        showAttach(false); qReview();
      });
    });
  }
  function qReview() {
    input.disabled = true;
    var q = data.quote;
    var summary = "Here's what I've got:\n\n" +
      "👤 " + q.name + "\n" +
      "📞 " + q.phone + "\n" +
      "✉️ " + q.email + "\n" +
      "📍 " + q.suburb + "\n" +
      "🧹 " + q.service + "\n" +
      "🏠 " + q.property + " · " + q.size + "\n" +
      "📅 " + q.when + "\n" +
      (q.details ? "📝 " + q.details + "\n" : "") +
      (data.photos.length ? "📎 " + data.photos.length + " photo(s)\n" : "");
    botSay(escapeHtml(summary).replace(/\n/g, "<br>"), function () {
      quick(["✅ Send my enquiry", "Start over"], function (opt) {
        userSay(opt);
        if (opt === "Start over") { botSay("No worries, let's start again.", function () { startQuote(); }); }
        else submit();
      });
    });
  }

  function submit() {
    input.disabled = true;
    botSay("Sending your enquiry…", function () {
      var q = data.quote;
      var keyOk = CONFIG.WEB3FORMS_ACCESS_KEY && CONFIG.WEB3FORMS_ACCESS_KEY.indexOf("YOUR-") !== 0;
      if (keyOk) {
        var fd = new FormData();
        fd.append("access_key", CONFIG.WEB3FORMS_ACCESS_KEY);
        fd.append("subject", "New cleaning enquiry — " + q.name + " (" + q.suburb + ")");
        fd.append("from_name", "LNS website chatbot");
        fd.append("Name", q.name);
        fd.append("Phone", q.phone);
        fd.append("Email", q.email);
        fd.append("replyto", q.email);
        fd.append("Suburb", q.suburb);
        fd.append("Service", q.service);
        fd.append("Property", q.property + " / " + q.size);
        fd.append("Timing", q.when);
        fd.append("Details", q.details || "(none)");
        fd.append("Chat transcript", data.transcript.join("\n"));
        fd.append("botcheck", "");
        data.photos.forEach(function (f, i) { fd.append("photo_" + (i + 1), f, f.name); });
        fetch("https://api.web3forms.com/submit", { method: "POST", body: fd })
          .then(function (r) { return r.json(); })
          .then(function (res) { if (res.success) success(); else fail(); })
          .catch(fail);
      } else {
        // Fallback: open the visitor's email app prefilled
        var bodyLines = [
          "New cleaning enquiry from the LNS website:", "",
          "Name: " + q.name, "Phone: " + q.phone, "Email: " + q.email,
          "Suburb: " + q.suburb, "Service: " + q.service,
          "Property: " + q.property + " / " + q.size, "Timing: " + q.when,
          "Details: " + (q.details || "(none)"),
          data.photos.length ? "" : "", data.photos.length ? "(Visitor has " + data.photos.length + " photo(s) to attach manually.)" : "",
        ].filter(Boolean);
        var href = "mailto:" + CONFIG.BUSINESS_EMAIL + "?subject=" + encodeURIComponent("New cleaning enquiry — " + q.name + " (" + q.suburb + ")") + "&body=" + encodeURIComponent(bodyLines.join("\n"));
        window.location.href = href;
        success(true);
      }
    });
  }

  function success(mailto) {
    botSay("✅ Thanks " + escapeHtml(data.quote.name.split(" ")[0]) + "! Your enquiry " + (mailto ? "is ready in your email app" : "has been sent to our team") + ". We'll get back to you with a quote within one business day." + (mailto && data.photos.length ? " Don't forget to attach your photos in the email." : ""), function () {
      quick([{ label: "📞 Call " + CONFIG.BUSINESS_PHONE_DISPLAY }, { label: "Start a new enquiry" }], function (opt) {
        if (opt.label.indexOf("Call") > -1) { window.location.href = "tel:" + CONFIG.BUSINESS_PHONE_TEL; }
        else { data = { transcript: [], photos: [] }; renderFiles(); botSay("Happy to help again — what can I do?", showMenu); }
      });
    });
  }
  function fail() {
    botSay("Sorry — something went wrong sending that. Please call us on <a href=\"tel:" + CONFIG.BUSINESS_PHONE_TEL + "\">" + CONFIG.BUSINESS_PHONE_DISPLAY + "</a> or email <a href=\"mailto:" + CONFIG.BUSINESS_EMAIL + "\">" + CONFIG.BUSINESS_EMAIL + "</a> and we'll sort it out.", function () {
      quick(["Try again"], function () { submit(); });
    });
  }
})();
