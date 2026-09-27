/* Goobs-Games "house ads": vintage-style joke cards shown between rounds, shared by every game.
   All rhymes and copy are original. No real slogans, jingles or logos.
   USE_REAL_BRANDS: true shows real brand names (private family use).
   Set to false before sharing publicly; every card then uses its made-up brand. */
var GoobsAds = (function () {
  'use strict';
  var USE_REAL_BRANDS = true;
  // Base URL of /shared/, so cards can use the shared animal drawings from any page
  var BASE = (function () {
    try { return new URL('.', document.currentScript.src).href; } catch (e) { return ''; }
  })();
  function animalHref(a) { return document.getElementById('a-' + a) ? '#a-' + a : BASE + 'animals.svg#a-' + a; }

  var CARDS = [
    // ---- roadside rhyme signs (5 signs, last one is the brand) ----
    { style: 'burma', brand: 'Burma-Shave', alt: 'Barnyard-Shave', lines: ['OLD MACDONALD', 'HAD A BEARD', 'E-I-E-I-O', 'NOW IT\u2019S CLEARED'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Barnyard-Shave', lines: ['HIS BILLY-GOAT BEARD', 'CAUSED QUITE A FUSS', 'NOW HE\u2019S AS SMOOTH', 'AS THE REST OF US'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Barnyard-Shave', lines: ['PA\u2019S PRICKLY KISS', 'MADE MA SAY NAY', 'SHE KISSED THE HORSE', 'HE JUST SAID NEIGH'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Barnyard-Shave', lines: ['THE SHEEP GET SHORN', 'JUST ONCE IN MAY', 'BUT FARMER JOE', 'SHAVES EVERY DAY'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Barnyard-Shave', lines: ['THE TURKEY GOBBLED', 'WHEN HE SAW', 'THE STUBBLE ON', 'THE FARMER\u2019S JAW'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Barnyard-Shave', lines: ['THE PIG\u2019S SO SMOOTH', 'THE PIGLETS SQUEAL', 'HE SWIPED PA\u2019S TUBE', 'WHAT A STEAL'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Barnyard-Shave', lines: ['THE DUCK SAID QUACK', 'THE COW SAID MOO', 'MA SAID SHAVE', 'OR WE ARE THROUGH'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Barnyard-Shave', lines: ['HIS CHIN WAS SCRATCHY', 'AS A BALE OF HAY', 'HE LATHERED UP', 'NOW THE HENS ALL LAY'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Barnyard-Shave', lines: ['THE SCARECROW TRIED IT', 'ON HIS STRAW', 'NOW THE CROWS', 'JUST STAND IN AWE'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Barnyard-Shave', lines: ['THE ROOSTER CROWS', 'AT HALF PAST FIVE', 'A SMOOTH-CHEEKED FARMER', 'LOOKS ALIVE'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Barnyard-Shave', lines: ['SHE SOLVED THE PUZZLE', 'IN RECORD TIME', 'HE STILL HAD STUBBLE', 'AND HALF A RHYME'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Barnyard-Shave', lines: ['THE HENS ALL SAID', 'HIS WHISKERS SCRATCH', 'SO NOW HE SHAVES', 'BEFORE THEY HATCH'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Barnyard-Shave', lines: ['DON\u2019T RACE THE TRAIN', 'TO BEAT YOUR SCORE', 'THE GAME WILL WAIT', 'THE TRAIN WON\u2019T ANYMORE'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Barnyard-Shave', lines: ['GRANDPA\u2019S BEARD', 'HID HALF THE BOARD', 'HE SHAVED IT OFF', 'AND FINALLY SCORED'] },

    // ---- 1950s magazine ads ----
    { style: 'mag', brand: 'Ovaltine', alt: 'Moo-Maltine', animal: 'cow', accent: '#b8322a',
      head: 'Is Your Calf Getting Enough Pep?', body: 'Farm doctors agree: one warm mug at bedtime puts the moo back in your moo-ve.', tag: 'Stir up a mug tonight!' },
    { style: 'mag', brand: 'Quaker Oats', alt: 'Old Mill Oats', animal: 'horse', accent: '#1f5fa8',
      head: 'The Horse Knows Best!', body: 'Blue-ribbon ponies start every morning with a hearty bowl. Shouldn\u2019t you?', tag: 'Whinny for more!' },
    { style: 'mag', brand: 'Morton Salt', alt: 'Salt Lick Salt', animal: 'goat', accent: '#2a6db0',
      head: 'Goats Recommend It.', body: 'Four out of five goats prefer a good salt lick. The fifth goat ate the survey.', tag: 'Shake things up!' },
    { style: 'mag', brand: 'Campbell\u2019s', alt: 'Red Barn Soup', animal: 'pig', accent: '#c0392b',
      head: 'The Pig\u2019s Favorite Tomato Soup', body: 'Ten ripe tomatoes in every can, and not one pig was asked to help.', tag: 'Slurp it piping hot!' },
    { style: 'mag', brand: 'Jell-O', alt: 'Wiggle-O', animal: 'duck', accent: '#d35400',
      head: 'Wobble Like a Duckling!', body: 'Six shimmering flavors that jiggle, joggle and waddle right to the table.', tag: 'The dessert that waddles!' },
    { style: 'mag', brand: 'Kellogg\u2019s Corn Flakes', alt: 'Sunny Acre Flakes', animal: 'rooster', accent: '#d9701e',
      head: 'He Gets Up Early for These.', body: 'Toasted golden flakes, crisp and ready before the very first cock-a-doodle.', tag: 'Rise and crunch!' },
    { style: 'mag', brand: 'Wrigley\u2019s Spearmint', alt: 'Pasture Mint Gum', animal: 'sheep', accent: '#23894f',
      head: 'Chew Like a Sheep!', body: 'Sheep chew all day long and never look worried. Try it for a week and see.', tag: 'Fresh as a spring meadow.' },
    { style: 'mag', brand: 'Coca-Cola', alt: 'Farmstand Cola', animal: 'dog', accent: '#b71c1c',
      head: 'Even Rover Waits by the Icebox.', body: 'Ice-cold and bubbly after the hay is in. Pour one for the hired hand, too.', tag: 'Worth a wag!' },
    { style: 'mag', brand: 'Sears Catalog', alt: 'Big Barn Catalog', animal: 'turkey', accent: '#6d4c41',
      head: 'Everything for the Farm!', body: 'Overalls, egg baskets, butter churns and turkey-sized slippers. Order by mail today.', tag: 'Delivered right to your gate!' },
    { style: 'mag', brand: 'Philco', alt: 'Hayloft Radio', animal: 'rabbit', accent: '#5e35b1',
      head: 'Tune In the Saturday Barn Dance!', body: 'Crystal-clear fiddles from coast to coast. Rabbit ears included at no extra charge.', tag: 'The whole farm will listen!' },
    { style: 'mag', brand: 'Kool-Aid', alt: 'Pitcher-Pop', animal: 'duck', accent: '#c2185b',
      head: 'Pour a Pitcher of Sunshine!', body: 'Stir, sip and smile. Even the barn cat comes back for seconds.', tag: 'Six sunny flavors!' },
    { style: 'mag', brand: 'Maxwell House', alt: 'Farmhouse Roast', animal: 'rooster', accent: '#4e342e',
      head: 'Up Before the Rooster?', body: 'A hot cup for early chores, long crosswords and one more puzzle before breakfast.', tag: 'Brewed for early birds.' },
    { style: 'mag', brand: 'Cracker Jack', alt: 'Hayride Crunch', animal: 'goat', accent: '#c62828',
      head: 'Popcorn, Peanuts & Pure Fun', body: 'Sweet crunchy corn for the hayride home. The goat will try to share.', tag: 'Crunch all the way home!' },

    // ---- painted barn roofs ----
    { style: 'barn', brand: 'Rock City', alt: 'Haystack Hill', top: 'THE COWS HAVE SEEN', bottom: 'HAVE YOU?' },
    { style: 'barn', brand: 'Meramec Caverns', alt: 'Old Hollow Caverns', top: 'VISIT', bottom: 'COOLER THAN THE PIGPEN' },
    { style: 'barn', brand: 'Dr Pepper', alt: 'Doc Barley Soda', top: 'DRINK', bottom: 'NEIGH-TURALLY GOOD, SAYS THE HORSE' },
    { style: 'barn', brand: 'Texaco', alt: 'Tri-County Gas', top: 'FILL \u2019ER UP AT', bottom: 'THE TRACTOR INSISTS' },
    { style: 'barn', brand: 'Ruby Falls', alt: 'Silver Creek Falls', top: 'SEE', bottom: 'THE DUCKS ALREADY DID' }
  ];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function brandOf(c) { return USE_REAL_BRANDS ? c.brand : c.alt; }

  function fitText(x, y, size, text, maxW, extra) {
    var est = text.length * size * 0.62;
    var fit = est > maxW ? ' textLength="' + maxW + '" lengthAdjust="spacingAndGlyphs"' : '';
    return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" text-anchor="middle"' + fit + (extra || '') + '>' + esc(text) + '</text>';
  }

  function barnSvg(c) {
    var b = brandOf(c).toUpperCase();
    return '<svg viewBox="0 0 300 200" aria-hidden="true">' +
      '<g stroke="#3a2616" stroke-width="2.5" stroke-linejoin="round">' +
      '<path d="M8 100 L40 36 L244 36 L210 100Z" fill="#2f2b28"/>' +
      '<rect x="18" y="100" width="192" height="76" fill="#b3322a"/>' +
      '<path d="M18 118 H210 M18 138 H210 M18 158 H210" stroke="#8e241e" stroke-width="1.5" fill="none"/>' +
      '<path d="M210 100 L244 36 L282 100Z" fill="#b3322a"/>' +
      '<rect x="210" y="100" width="72" height="76" fill="#a52c25"/>' +
      '<rect x="226" y="122" width="40" height="54" fill="#fff"/>' +
      '<path d="M226 122 L266 176 M266 122 L226 176" fill="none"/>' +
      '<rect x="236" y="70" width="20" height="18" fill="#f2d27a"/>' +
      '<path d="M0 186 H300" stroke="#6b4a2b" stroke-width="3"/>' +
      '<path d="M12 176 V194 M60 176 V194 M108 176 V194 M156 176 V194 M204 176 V194 M252 176 V194 M296 176 V194" stroke="#6b4a2b" stroke-width="3"/>' +
      '</g>' +
      '<g fill="#fff" font-family="Georgia, Times New Roman, serif" font-weight="900">' +
      fitText(127, 54, 12, c.top, 150) +
      fitText(126, 77, 22, b, 168) +
      fitText(124, 93, 10, c.bottom, 158) +
      '</g></svg>';
  }

  /* Render a card into el. onShown() fires when the card is fully revealed. Returns a cancel function. */
  function render(c, el, onShown, onStep) {
    var timers = [];
    if (c.style === 'burma') {
      var signs = c.lines.map(function (l) { return '<div class="sign">' + esc(l) + '</div>'; }).join('') +
        '<div class="sign brand">' + esc(brandOf(c).toUpperCase()) + '</div>';
      el.innerHTML = '<div class="ad burma"><div class="road"></div><div class="signs">' + signs + '</div><span class="adv">ROADSIDE READING</span></div>';
      var list = el.querySelectorAll('.sign');
      Array.prototype.forEach.call(list, function (s, i) {
        timers.push(setTimeout(function () { s.classList.add('up'); if (onStep) onStep(i); if (i === list.length - 1) onShown(); }, 150 + i * 320));
      });
    } else if (c.style === 'mag') {
      el.innerHTML = '<div class="ad mag" style="--accent:' + c.accent + '"><span class="adv">ADVERTISEMENT</span>' +
        '<div class="mhead">' + esc(c.head) + '</div>' +
        '<div class="mart"><svg viewBox="0 0 100 100"><use href="' + animalHref(c.animal) + '"/></svg></div>' +
        '<div class="mbody">' + esc(c.body) + '</div>' +
        '<div class="mbrand">' + esc(brandOf(c)) + '</div>' +
        '<div class="mtag">' + esc(c.tag) + '</div></div>';
      timers.push(setTimeout(onShown, 350));
    } else {
      el.innerHTML = '<div class="ad barnad">' + barnSvg(c) + '<span class="adv">PAINTED FRESH</span></div>';
      timers.push(setTimeout(onShown, 350));
    }
    return function () { timers.forEach(clearTimeout); };
  }

  // Deck of indices; draw without repeats until the deck is used up, then reshuffle.
  function draw(deck, lastIdx) {
    if (!deck || !deck.length) {
      deck = [];
      for (var i = 0; i < CARDS.length; i++) deck.push(i);
      for (i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
      if (deck[deck.length - 1] === lastIdx && deck.length > 1) { t = deck[0]; deck[0] = deck[deck.length - 1]; deck[deck.length - 1] = t; }
    }
    var idx = deck.pop();
    return { idx: idx, deck: deck, card: CARDS[idx] };
  }

  // ---------- overlay: one shared card at a time, closes only with the X ----------
  var ov = null, cancel = null, doneCb = null;
  function ensureOverlay() {
    if (ov) return ov;
    ov = document.createElement('div');
    ov.className = 'overlay center adov';
    ov.id = 'ovAd';
    ov.innerHTML = '<div class="adframe"><button class="adclose" aria-label="Close ad"><svg viewBox="0 0 24 24"><path d="M5 5L19 19M19 5L5 19" stroke="#111" stroke-width="3.6" stroke-linecap="round" fill="none"/></svg></button><div class="adbody"></div></div>';
    document.body.appendChild(ov);
    ov.querySelector('.adclose').addEventListener('click', close);
    return ov;
  }
  function loadDeck() { try { return JSON.parse(localStorage.getItem('goobs.adDeck') || 'null') || { deck: [], last: -1 }; } catch (e) { return { deck: [], last: -1 }; } }
  function saveDeck(d) { try { localStorage.setItem('goobs.adDeck', JSON.stringify(d)); } catch (e) { /* ignore */ } }
  /* show({onShow, onStep}, done): done() runs after the player taps the X */
  function show(hooks, done) {
    hooks = hooks || {};
    ensureOverlay();
    var d = loadDeck(), pick = draw(d.deck, d.last);
    saveDeck({ deck: pick.deck, last: pick.idx });
    doneCb = done || null;
    ov.classList.add('show');
    if (hooks.onShow) hooks.onShow();
    cancel = render(pick.card, ov.querySelector('.adbody'), function () {}, hooks.onStep);
  }
  function close() {
    if (!ov || !ov.classList.contains('show')) return;
    if (cancel) cancel();
    cancel = null;
    ov.classList.remove('show');
    ov.querySelector('.adbody').innerHTML = '';
    var d = doneCb; doneCb = null;
    if (d) d();
  }
  function isOpen() { return !!(ov && ov.classList.contains('show')); }

  return { CARDS: CARDS, render: render, draw: draw, show: show, close: close, isOpen: isOpen };
})();
