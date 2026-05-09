document.addEventListener('DOMContentLoaded', () => {

  /* ═══════════════════════════════════════
     HEADER — sticky + scroll effect
  ═══════════════════════════════════════ */
  const header = document.getElementById('header');
  let lastScroll = 0;

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    lastScroll = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ═══════════════════════════════════════
     BURGER / MOBILE NAV
  ═══════════════════════════════════════ */
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobileNav');

  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('active');
    mobileNav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  mobileNav.querySelectorAll('.mobile-nav__link').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      mobileNav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* ═══════════════════════════════════════
     SMOOTH SCROLL for anchor links
  ═══════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ═══════════════════════════════════════
     SCROLL ANIMATIONS (IntersectionObserver)
  ═══════════════════════════════════════ */
  const animElements = document.querySelectorAll('[data-animate]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.delay || '0', 10);
          setTimeout(() => el.classList.add('visible'), delay);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    animElements.forEach(el => observer.observe(el));
  } else {
    animElements.forEach(el => el.classList.add('visible'));
  }

  /* ═══════════════════════════════════════
     TELEGRAM BOT — send leads
  ═══════════════════════════════════════ */
  const TG_BOT_TOKEN = '8789925612:AAFvUxmS75VpT7CWAFMjcrlLOGGs37t5neE';
  const TG_CHAT_ID = '7602635557';
  const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbw8h8AD_WsWbtmYN8SNDZPXhgP6EsJzVYRRDjlpqKaAR0CHPLH2K6L76QduetfAlOmN/exec';

  function sendToSheets(data) {
    return fetch(SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {});
  }

  function sendToTelegram(text) {
    const url = 'https://api.telegram.org/bot' + TG_BOT_TOKEN + '/sendMessage';
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    }).then(r => r.json()).then(data => {
      if (!data.ok) console.warn('Telegram error:', data);
      return data;
    }).catch(err => {
      console.error('Telegram send failed:', err);
    });
  }

  /* ═══════════════════════════════════════
     LEAD FORMS (hero + footer)
  ═══════════════════════════════════════ */
  function handleForm(form, formName) {
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const inputs = form.querySelectorAll('input[required]');
      let valid = true;

      inputs.forEach(inp => {
        inp.classList.remove('error');
        if (!inp.value.trim()) {
          inp.classList.add('error');
          valid = false;
        }
        if (inp.type === 'email' && inp.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value)) {
          inp.classList.add('error');
          valid = false;
        }
      });

      if (!valid) return;

      const data = {};
      inputs.forEach(inp => { data[inp.name] = inp.value.trim(); });

      // Send to Telegram
      const now = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
      let msg = '🏠 <b>Новая заявка — ' + formName + '</b>\n';
      msg += '━━━━━━━━━━━━━━━\n';
      if (data.name)  msg += '👤 <b>Имя:</b> ' + data.name + '\n';
      if (data.city)  msg += '📍 <b>Город:</b> ' + data.city + '\n';
      if (data.phone) msg += '📞 <b>Телефон:</b> ' + data.phone + '\n';
      if (data.email) msg += '📧 <b>Email:</b> ' + data.email + '\n';
      msg += '━━━━━━━━━━━━━━━\n';
      msg += '🕐 ' + now;

      sendToTelegram(msg);

      // Send to Google Sheets
      sendToSheets({
        type: 'form',
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        source: formName
      });

      const btn = form.querySelector('button[type="submit"]');
      const origText = btn.textContent;
      btn.textContent = 'Отправлено!';
      btn.disabled = true;
      btn.style.background = 'rgba(74,124,89,0.6)';

      setTimeout(() => {
        form.reset();
        btn.textContent = origText;
        btn.disabled = false;
        btn.style.background = '';
      }, 3000);
    });

    form.querySelectorAll('input[required]').forEach(inp => {
      inp.addEventListener('input', () => inp.classList.remove('error'));
    });
  }

  handleForm(document.getElementById('heroForm'), 'Консультация (герой)');
  handleForm(document.getElementById('footerForm'), 'Форма в футере');

  /* ═══════════════════════════════════════
     CALCULATOR
  ═══════════════════════════════════════ */
  const calcArea = document.getElementById('calcArea');
  const calcAreaValue = document.getElementById('calcAreaValue');

  if (calcArea) {
    // Pricing config (price per m² base)
    const materialPrices = {
      frame:    25000,
      profiled: 35000,
      glued:    48000,
      log:      42000
    };
    const foundationPrices = {
      screw: 3500,   // per m²
      strip: 5500,
      slab:  7000
    };
    const roofPrices = {
      metal:   1800,  // per m²
      soft:    2200,
      natural: 4500
    };
    const floorMultipliers = {
      '1': 1.0,
      '2': 0.85,     // 2nd floor cheaper per m² (shared foundation/roof)
      '3': 0.78      // mansard even more efficient
    };
    const extras = {
      terrace:     { label: 'Терраса',       pct: 0.06 },
      warm:        { label: 'Утепление',     pct: 0.12 },
      engineering: { label: 'Инженерия',     pct: 0.15 },
      interior:    { label: 'Отделка',       pct: 0.18 }
    };

    // State
    let state = {
      area: 100,
      floors: '1',
      material: 'profiled',
      foundation: 'screw',
      roof: 'metal',
      extras: []
    };

    // Button groups
    function setupBtnGroup(id, field) {
      const el = document.getElementById(id);
      if (!el) return;
      el.querySelectorAll('.calc__btn').forEach(btn => {
        btn.addEventListener('click', () => {
          el.querySelectorAll('.calc__btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state[field] = btn.dataset.value;
          calculate();
        });
      });
    }
    setupBtnGroup('calcFloors', 'floors');
    setupBtnGroup('calcMaterial', 'material');
    setupBtnGroup('calcFoundation', 'foundation');
    setupBtnGroup('calcRoof', 'roof');

    // Range
    calcArea.addEventListener('input', () => {
      state.area = parseInt(calcArea.value, 10);
      calcAreaValue.textContent = state.area + ' м²';
      // Update range track fill
      const pct = (state.area - 30) / (350 - 30) * 100;
      calcArea.style.background = 'linear-gradient(to right, var(--c-green) ' + pct + '%, rgba(255,255,255,0.08) ' + pct + '%)';
      calculate();
    });
    // Init track fill
    calcArea.dispatchEvent(new Event('input'));

    // Checkboxes
    ['calcTerrace','calcWarm','calcEngineering','calcInterior'].forEach(id => {
      const cb = document.getElementById(id);
      if (!cb) return;
      cb.addEventListener('change', () => {
        if (cb.checked) {
          state.extras.push(cb.value);
        } else {
          state.extras = state.extras.filter(v => v !== cb.value);
        }
        calculate();
      });
    });

    function formatPrice(n) {
      return Math.round(n).toLocaleString('ru-RU') + ' ₽';
    }

    function calculate() {
      const area = state.area;
      const floorMult = floorMultipliers[state.floors] || 1;

      // Base: walls
      const wallsCost = area * materialPrices[state.material] * floorMult;

      // Foundation (based on footprint — area / floors for 2+)
      const footprint = state.floors === '1' ? area : area * 0.55;
      const foundCost = footprint * foundationPrices[state.foundation];

      // Roof (roughly equal to footprint)
      const roofArea = footprint * 1.3;
      const roofCost = roofArea * roofPrices[state.roof];

      let subtotal = wallsCost + foundCost + roofCost;

      // Breakdown
      const breakdown = [
        { label: 'Стены и конструкция', value: wallsCost },
        { label: 'Фундамент',          value: foundCost },
        { label: 'Кровля',             value: roofCost }
      ];

      // Extras
      state.extras.forEach(key => {
        const ext = extras[key];
        if (ext) {
          const cost = subtotal * ext.pct;
          breakdown.push({ label: ext.label, value: cost });
          subtotal += cost;
        }
      });

      // Display
      document.getElementById('calcTotalPrice').textContent = formatPrice(subtotal);

      const bdEl = document.getElementById('calcBreakdown');
      bdEl.innerHTML = breakdown.map(r =>
        '<div class="calc__breakdown-row"><span class="calc__breakdown-label">' + r.label + '</span><span class="calc__breakdown-value">' + formatPrice(r.value) + '</span></div>'
      ).join('');

      // Timeline
      let days;
      if (area <= 60) days = '30–45';
      else if (area <= 100) days = '45–75';
      else if (area <= 150) days = '60–90';
      else if (area <= 200) days = '90–120';
      else days = '120–180';
      document.getElementById('calcTimeline').textContent = days + ' дней';
    }

    calculate();
  }

  /* ═══════════════════════════════════════
     PROJECT MODAL
  ═══════════════════════════════════════ */
  const projectsData = {
    1: {
      name: 'Лесной',
      price: 'от 4 200 000 ₽',
      heroImg: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
      specs: [
        { value: '120 м²', label: 'Площадь' },
        { value: '2', label: 'Этажа' },
        { value: '4', label: 'Комнаты' },
        { value: '8×10', label: 'Размер' },
        { value: 'Брус', label: 'Материал' },
        { value: '90 дней', label: 'Срок' }
      ],
      desc: 'Проект «Лесной» — это классический двухэтажный дом из профилированного бруса, идеальный для постоянного проживания семьи. Продуманная планировка с просторной гостиной на первом этаже, кухней-столовой и 3 спальнями на втором. Включена открытая терраса, котельная и два санузла. Дом утеплён по финской технологии — комфортно круглый год.',
      story: {
        title: 'История проекта «Лесной»',
        client: 'Семья Петровых — молодая пара с двумя детьми из Москвы. Хотели переехать за город, но не знали, какой тип дома выбрать.',
        process: 'На первой встрече мы обсудили их образ жизни: дети школьного возраста, удалённая работа, две собаки. Стало ясно — нужен просторный дом с отдельным кабинетом и большой террасой. Мы предложили профилированный брус 150×150: он тёплый, экологичный и быстро собирается. Заказчики выезжали на стройку каждые выходные — мы проводили совместные обходы, обсуждали детали: расположение розеток, высоту подоконников, тип лестницы. По их просьбе добавили второй санузел на втором этаже и расширили кухню-столовую. Итого от первого звонка до новоселья прошло 4 месяца.',
        result: 'Семья заселилась в августе. Отмечали новоселье прямо на террасе. Через год позвонили — хотят заказать баню на участке.'
      },
      gallery: [
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600&q=80&crop=top',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600&q=80&crop=right',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80'
      ],
      stages: [
        { num: '01', title: 'Знакомство и проект', text: 'Провели 3 встречи с семьёй Петровых, выехали на участок, оценили грунт и рельеф. Архитектор подготовил проект за 2 недели с 3D-визуализацией. Заказчики попросили увеличить кухню на 4 м² — внесли правки за день.', img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=70' },
        { num: '02', title: 'Фундамент', text: 'Геология показала суглинок — выбрали ленточный мелкозаглублённый фундамент с армированием. Залили за 8 дней, дали 3 недели на набор прочности. Параллельно подвели воду и канализацию.', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=70' },
        { num: '03', title: 'Сборка сруба', text: 'Профилированный брус 150×150 камерной сушки доставили с нашего склада. Бригада из 6 человек собрала коробку первого этажа за 12 дней. Каждый венец проверяли уровнем. Заказчики приезжали — показали, как укладывается межвенцовый утеплитель.', img: 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?auto=format&fit=crop&w=400&q=70' },
        { num: '04', title: 'Второй этаж и кровля', text: 'Смонтировали балки перекрытия, собрали стены второго этажа. Стропильная система — двускатная с выносом 600 мм. Покрыли металлочерепицей Grand Line. Установили мансардные окна Velux в детской.', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=70' },
        { num: '05', title: 'Инженерия и отделка', text: 'Провели электрику (42 точки), водоснабжение, отопление газовым котлом Baxi. Тёплые полы на первом этаже. Внутренняя отделка: стены шлифовка + лак, потолки — вагонка, полы — лиственница 28 мм. Лестница из ясеня на заказ.', img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=70' },
        { num: '06', title: 'Сдача и новоселье', text: 'Финальный обход с заказчиками: проверили каждую розетку, каждый кран. Составили акт, передали ключи и гарантийный паспорт. Весь процесс от первого звонка до заселения — 4 месяца.', img: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=400&q=70' }
      ]
    },
    2: {
      name: 'Сибирский',
      price: 'от 6 800 000 ₽',
      heroImg: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&q=80',
      specs: [
        { value: '180 м²', label: 'Площадь' },
        { value: '2', label: 'Этажа' },
        { value: '5', label: 'Комнат' },
        { value: '10×12', label: 'Размер' },
        { value: 'Клеёный брус', label: 'Материал' },
        { value: '120 дней', label: 'Срок' }
      ],
      desc: 'Проект «Сибирский» — просторный дом из клеёного бруса для большой семьи. Два полноценных этажа с 5 комнатами, 2 санузлами, кабинетом, котельной и террасой. Панорамные окна в гостиной, второй свет, камин. Усиленное утепление для суровых зим. Идеален для загородного проживания.',
      story: {
        title: 'История проекта «Сибирский»',
        client: 'Андрей и Елена, трое детей, живут в Красноярске. Прежний каркасный дом перестал справляться с морозами -40°C. Хотели капитальный тёплый дом.',
        process: 'Клиенты сразу обозначили главное требование: дом должен быть тёплым при -45°C без огромных счетов за отопление. Мы предложили клеёный брус 200 мм — минимальная усадка и отличная теплоизоляция. Провели теплотехнический расчёт: стены, утеплённая кровля 250 мм, тройные стеклопакеты. Андрей — инженер, он участвовал в выборе каждого материала: вместе ездили на завод-производитель бруса в Томск, проверяли сертификаты клея. Елена занималась планировкой: ей было важно, чтобы кухня выходила на юг, а кабинет мужа был изолирован от детской зоны. Строили с мая по сентябрь — успели до морозов.',
        result: 'Первую зиму дом прошёл при -42°C. Расход газа оказался на 30% ниже расчётного. Андрей прислал фото термометра на улице и в доме: +23°C внутри. Семья довольна.'
      },
      gallery: [
        'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=600&q=80&crop=top',
        'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=600&q=80&crop=left',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80&crop=right',
        'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=600&q=80'
      ],
      stages: [
        { num: '01', title: 'Теплотехнический расчёт', text: 'Выехали в Красноярск, осмотрели участок. Инженер провёл геологию и теплотехнический расчёт. Определили: клеёный брус 200 мм + утеплённая кровля 250 мм базальтовой ваты. Разработали проект за 3 недели, 4 раза пересогласовывали планировку с Еленой.', img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=70' },
        { num: '02', title: 'Фундамент и цоколь', text: 'Для промерзающего грунта выбрали монолитную плиту 300 мм с утеплением ЭППС 100 мм по периметру. Заложили трубы тёплого пола прямо в плиту. Работали в мае — грунт уже оттаял. Параллельно залили отмостку с утеплением.', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=70' },
        { num: '03', title: 'Сборка стен', text: 'Клеёный брус изготовлен на заводе в Томске — Андрей лично проверял партию. Доставили 4 фурами. Сборка с посадкой на нагели, межвенцовый утеплитель — финский Saicos. Первый этаж — 18 дней, второй — 14 дней. Ежедневный фотоотчёт клиенту.', img: 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?auto=format&fit=crop&w=400&q=70' },
        { num: '04', title: 'Кровля и окна', text: 'Стропильная система с утеплением 250 мм. Кровля — натуральная черепица Braas (Андрей выбирал на выставке). Окна — тройные стеклопакеты Rehau с тёплым профилем, панорамное остекление в гостиной 4×2.5 м. Второй свет с балками из лиственницы.', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=70' },
        { num: '05', title: 'Инженерия', text: 'Газовый конденсационный котёл Viessmann 35 кВт, тёплые полы на обоих этажах, рекуперация воздуха Zehnder. Электрика: 78 точек, щиток на 36 модулей, резервный генератор. Андрей контролировал каждый узел — мы делали расширенный фотоотчёт по скрытым работам.', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=70&crop=bottom' },
        { num: '06', title: 'Отделка и сдача', text: 'Внутренняя отделка: шлифовка бруса + масло Osmo, полы — массив дуба, камин Tulikivi (финский). Ванные — керамогранит с тёплым полом. Мебель по проекту Елены. Сдали в сентябре, за 2 недели до первых заморозков.', img: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=400&q=70' }
      ]
    },
    3: {
      name: 'Дачный',
      price: 'от 2 100 000 ₽',
      heroImg: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80',
      specs: [
        { value: '65 м²', label: 'Площадь' },
        { value: '1', label: 'Этаж' },
        { value: '2', label: 'Комнаты' },
        { value: '6×8', label: 'Размер' },
        { value: 'Каркас', label: 'Материал' },
        { value: '45 дней', label: 'Срок' }
      ],
      desc: 'Проект «Дачный» — компактный и уютный каркасный дом для сезонного или постоянного проживания. Два уютных спальни, светлая кухня-гостиная, санузел и крытая веранда. Быстрая сборка за 45 дней. Экономичное решение без потери качества.',
      story: {
        title: 'История проекта «Дачный»',
        client: 'Виктор Николаевич, 62 года, пенсионер из Тулы. Получил участок 12 соток в наследство и хотел построить небольшой дом для летнего проживания с женой.',
        process: 'Виктор Николаевич сразу сказал: «Бюджет ограничен, но халтуру не хочу». Предложили каркасную технологию — оптимальное соотношение цены и качества. Провели одну встречу в офисе, показали образцы утеплителя и обшивки. Клиент выбрал имитацию бруса для фасада — «чтобы выглядел как настоящий деревянный». Планировку обсуждали по телефону: ему было важно, чтобы с веранды было видно сад, а спальня не выходила на дорогу. Строили в июне-июле, за 42 дня. Виктор Николаевич приезжал дважды: на заливку фундамента и на приёмку.',
        result: 'Дом сдан в июле. Виктор Николаевич привёз жену на следующий день — она не поверила, что это их дом. Через месяц прислал фото: веранда, самовар, кошка на ступеньках.'
      },
      gallery: [
        'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=600&q=80&crop=top',
        'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=600&q=80&crop=right',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=600&q=80'
      ],
      stages: [
        { num: '01', title: 'Быстрый старт', text: 'Виктор Николаевич позвонил в апреле. За 5 дней подготовили проект с привязкой к его участку: входная группа — на юг, спальня — на восток, веранда — с видом на яблоневый сад. Смету согласовали за один визит в офис.', img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=70' },
        { num: '02', title: 'Свайный фундамент', text: 'Установили 12 винтовых свай за один день. Грунт — песчаный, идеально для свай. Обвязка из бруса 150×200 на следующий день. Виктор Николаевич приехал посмотреть — убедился, что сваи стоят ровно, замерил уровнем.', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=70' },
        { num: '03', title: 'Каркас и утепление', text: 'Каркас из сухой строганной доски 45×195 мм. Утепление — базальтовая вата Rockwool 150 мм, пароизоляция, ветрозащита. Бригада 4 человека собрала каркас за 10 дней. Обшили фасад имитацией бруса — клиент выбирал цвет по каталогу: «медовый дуб».', img: 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?auto=format&fit=crop&w=400&q=70' },
        { num: '04', title: 'Кровля и фасад', text: 'Мягкая кровля Shinglas — лёгкая, не шумит в дождь (это было важно для клиента). Водосточная система, отливы. Покрасили фасад в два слоя — Tikkurila Ultra, цвет «сосна». Крыльцо с навесом и ступенями из лиственницы.', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=70' },
        { num: '05', title: 'Отделка и сдача', text: 'Внутри: стены — вагонка, полы — ламинат 33 класса, санузел — керамическая плитка. Электрика: 18 точек, летний водопровод. Веранда 12 м² с прозрачной крышей из поликарбоната. Общий срок — 42 дня. Виктор Николаевич принял дом и пожал каждому строителю руку.', img: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=400&q=70' }
      ]
    },
    4: {
      name: 'Скандинавский',
      price: 'от 3 500 000 ₽',
      heroImg: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80',
      specs: [
        { value: '95 м²', label: 'Площадь' },
        { value: '1', label: 'Этаж' },
        { value: '3', label: 'Комнаты' },
        { value: '8×9', label: 'Размер' },
        { value: 'Двойной брус', label: 'Материал' },
        { value: '75 дней', label: 'Срок' }
      ],
      desc: 'Проект «Скандинавский» — одноэтажный дом в минималистичном стиле с тёплым деревом и панорамными окнами. Технология двойного бруса — стены без мостиков холода. 3 комнаты, светлая гостиная, сауна. Энергоэффективность класса A.',
      story: {
        title: 'История проекта «Скандинавский»',
        client: 'Марина — архитектор интерьеров, 38 лет. Давно мечтала о собственном доме в скандинавском стиле: минимализм, свет, натуральные материалы.',
        process: 'Марина пришла с чёткими референсами: Pinterest-доска на 200 пинов, 3 книги по скандинавскому дизайну и список требований на 2 страницы. Она знала, чего хочет: панорамные окна в пол, белые стены, тёплые полы, сауна. Мы предложили двойной брус — технологию, при которой стена состоит из двух слоёв бруса с утеплителем между ними. Ноль мостиков холода, энергоэффективность класса A. Марина была в восторге. Она сама рисовала планировку, мы адаптировали под конструктив. Вместе выбирали на производстве текстуру бруса — она хотела светлый, «скандинавский» тон. Три раза меняли расположение окон, пока не добились идеального света в гостиной.',
        result: 'Дом получился точно как на её референсах. Марина сделала фотосессию для портфолио и выложила в Instagram — за неделю получила 3 заказа на дизайн интерьера от наших клиентов.'
      },
      gallery: [
        'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80&crop=top',
        'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80&crop=left',
        'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=600&q=80&crop=top',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80&crop=right',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80&crop=left'
      ],
      stages: [
        { num: '01', title: 'Совместное проектирование', text: 'Марина приходила в офис 5 раз. Вместе с нашим архитектором перебрали 8 вариантов планировки. Финальный: открытая гостиная 35 м² с кухней-островом, 2 спальни, кабинет, сауна. Панорамные окна — на юг и запад, чтобы ловить закатное солнце.', img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=70' },
        { num: '02', title: 'Утеплённая шведская плита', text: 'Для энергоэффективного дома выбрали УШП — утеплённую шведскую плиту с интегрированным тёплым полом. Залили за 3 дня. В плиту заложили все коммуникации: канализация, водоснабжение, электрика. Марина приехала на заливку — проверяла, что трубы тёплого пола уложены с правильным шагом.', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=70' },
        { num: '03', title: 'Двойной брус', text: 'Стены из двойного бруса: два слоя 45 мм с воздушным зазором 130 мм, заполненным эковатой. Ноль мостиков холода. Брус — северная ель, камерная сушка до 12%. Марина выбрала текстуру «натуральный блонд». Сборка без гвоздей — только нагели. 22 дня на весь периметр.', img: 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?auto=format&fit=crop&w=400&q=70' },
        { num: '04', title: 'Панорамное остекление', text: 'Главное окно в гостиной — 5×2.7 м, безрамное остекление с тёплым профилем. Тройной стеклопакет с аргоном. Установка заняла целый день — кран поднимал блоки весом 300 кг. Марина снимала таймлапс. Когда солнце залило гостиную — все аплодировали.', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=70' },
        { num: '05', title: 'Сауна и интерьер', text: 'Сауну обшили кедром, установили финскую печь Harvia. Интерьер — совместный проект Марины и нашего дизайнера: белый воск на стенах, дубовый пол, датская мебель. Кухня-остров из массива берёзы. Освещение — тёплый свет 2700K на всех точках.', img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=400&q=70' },
        { num: '06', title: 'Энерго-тест и сдача', text: 'Перед сдачей провели блоуэр-дор тест: воздухопроницаемость — 0.6 ACH, что соответствует пассивному дому. Марина замерила расход электричества на отопление — 2800 кВт·ч за первую зиму. Это в 3 раза меньше, чем у соседних домов.', img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=70' }
      ]
    },
    5: {
      name: 'Премиум',
      price: 'от 9 500 000 ₽',
      heroImg: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=1200&q=80',
      specs: [
        { value: '240 м²', label: 'Площадь' },
        { value: '2', label: 'Этажа' },
        { value: '6', label: 'Комнат' },
        { value: '12×14', label: 'Размер' },
        { value: 'Кедр', label: 'Материал' },
        { value: '150 дней', label: 'Срок' }
      ],
      desc: 'Проект «Премиум» — элитный деревянный дом из сибирского кедра. Второй свет в гостиной, камин, мастер-спальня с гардеробной, кабинет, сауна, гараж на 2 машины. Полная инженерия: тёплые полы, умный дом, рекуперация. Авторский дизайн интерьера включён.',
      story: {
        title: 'История проекта «Премиум»',
        client: 'Дмитрий — владелец IT-компании, 45 лет. Хотел дом-резиденцию за городом, где можно и жить, и принимать деловых партнёров. Бюджет не ограничен, но качество — на первом месте.',
        process: 'Дмитрий начал с фразы: «Я хочу дом, в который не стыдно пригласить любого человека в мире». Мы собрали проектную группу: архитектор, инженер, дизайнер интерьера, ландшафтный дизайнер. Первые 2 месяца — только проектирование. Дмитрий утверждал каждый узел. Выбирали кедр на делянке в Красноярском крае — отобрали брёвна вручную, маркировали каждое. Кедр сушили 6 месяцев естественным способом. Камин заказали в Италии (Palazzetti), окна — в Германии (Internorm). Система «умный дом» KNX — свет, климат, безопасность, мультирум. Дмитрий контролировал через приложение на телефоне прямо со стройки.',
        result: 'Строительство заняло 5 месяцев, ещё 2 — дизайн интерьера и ландшафт. Дмитрий провёл первый бизнес-ужин дома через неделю после новоселья. Потом позвонил: «Партнёры спросили, кто строил. Дал ваш номер».'
      },
      gallery: [
        'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=600&q=80&crop=top',
        'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=600&q=80&crop=left',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80&crop=top',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80&crop=top',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80&crop=left'
      ],
      stages: [
        { num: '01', title: 'Индивидуальный проект', text: 'Проектная группа из 4 специалистов. 3D-модель в ArchiCAD с VR-просмотром — Дмитрий «ходил» по будущему дому в очках. 8 итераций планировки. Отдельно проектировали: гараж на 2 авто, сауну с зоной отдыха, винную комнату. Утвердили за 2 месяца.', img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=70' },
        { num: '02', title: 'Отбор материала', text: 'Кедровые брёвна — ручная отборка на делянке в Красноярском крае. Диаметр 28–32 см, возраст деревьев 80–120 лет. Каждое бревно маркировано и просушено 6 месяцев. Доставка спецтранспортом. Дмитрий летал на делянку — лично видел отбор.', img: 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?auto=format&fit=crop&w=400&q=70' },
        { num: '03', title: 'Монолитный фундамент', text: 'Фундамент — монолитная плита 400 мм с подвальным этажом (техпомещения, винная комната, кладовые). Гидроизоляция Sika, дренажная система по периметру. Подвал утеплён — влажность и температура стабильны круглый год.', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=70' },
        { num: '04', title: 'Сруб из кедра', text: 'Рубили в «канадскую чашу» — самый надёжный и красивый тип соединения. Бригада рубщиков — 8 мастеров с опытом 15+ лет. Второй свет в гостиной — высота 6 метров, брёвна длиной до 9 м. Каждый венец проверяли лазерным уровнем. Строили 2.5 месяца.', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=70' },
        { num: '05', title: 'Умный дом и инженерия', text: 'Система KNX: 120 точек управления. Свет, климат, мультирум, видеонаблюдение, автоматические ворота гаража. Котельная: конденсационный котёл Buderus 60 кВт + бойлер 300 л. Рекуперация Zehnder ComfoAir. Камин Palazzetti с водяным контуром — отапливает 1-й этаж.', img: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=400&q=70&crop=right' },
        { num: '06', title: 'Дизайн и ландшафт', text: 'Авторский дизайн интерьера: натуральный камень, дуб, кедр, кожа. Мебель — индивидуальный заказ в Италии. Ландшафт: альпийская горка, зона барбекю, подсветка дорожек. Сауна с панорамным окном на лес. Сдали через 7 месяцев от начала строительства.', img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=70' }
      ]
    },
    6: {
      name: 'Шале',
      price: 'от 7 200 000 ₽',
      heroImg: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80',
      specs: [
        { value: '160 м²', label: 'Площадь' },
        { value: '2', label: 'Этажа' },
        { value: '4', label: 'Комнаты' },
        { value: '10×11', label: 'Размер' },
        { value: 'Клеёный брус', label: 'Материал' },
        { value: '110 дней', label: 'Срок' }
      ],
      desc: 'Проект «Шале» — альпийский стиль с панорамными окнами и двускатной кровлей. Открытая планировка первого этажа: гостиная с камином, кухня-столовая, выход на террасу. На втором этаже — 3 спальни и ванная. Балкон с видом на участок. Фасад комбинированный: дерево и камень.',
      story: {
        title: 'История проекта «Шале»',
        client: 'Сергей и Ольга — семейная пара из Санкт-Петербурга, он — врач, она — преподаватель. Устали от города и решили переехать в Ленинградскую область.',
        process: 'Ольга влюблена в Альпы — каждый год ездили в Тироль. Хотела дом, как в австрийской деревне: камень внизу, дерево вверху, широкие свесы кровли, тёплые балконы. Мы нашли каменщика, который работал в Австрии 8 лет — он выложил цоколь из натурального камня «дикарь». Сергей контролировал бюджет — вместе оптимизировали: вместо натуральной черепицы взяли композитную (экономия 400 тыс.), зато камин оставили настоящий, финский. Планировку подстраивали под участок с перепадом высот 2 метра — это стало преимуществом: из гостиной — выход на террасу на уровне земли, а подвал — технический, с отдельным входом. Строили с апреля по август.',
        result: 'Сергей говорит: «Каждое утро выхожу на балкон с кофе и чувствую себя в Тироле». Ольга преподаёт онлайн из кабинета на втором этаже. Они пригласили нас на ужин — готовили тирольский штрудель.'
      },
      gallery: [
        'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80&crop=top',
        'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80&crop=left',
        'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80&crop=right',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80'
      ],
      stages: [
        { num: '01', title: 'Привязка к рельефу', text: 'Участок с перепадом 2 метра — для шале это идеально. Геодезист сделал топосъёмку. Архитектор вписал дом в рельеф: нижний уровень «врезан» в склон, верхний — на уровне земли. Ольга и Сергей 4 раза приезжали на участок с нашим архитектором, пока не нашли идеальное расположение.', img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=70' },
        { num: '02', title: 'Каменный цоколь', text: 'Фундамент — монолитный ленточный с цокольным этажом. Каменщик Мирослав (8 лет опыта в Австрии) выложил цоколь из натурального камня «дикарь» — каждый камень подбирал вручную. На цоколь ушло 3 недели. Сергей фотографировал процесс каждый день.', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=70' },
        { num: '03', title: 'Стены из клеёного бруса', text: 'Клеёный брус 180 мм — финская ель, завод в Петрозаводске. Доставка водным транспортом по Ладоге — дешевле и бережнее. Сборка стен: 20 дней. Балки второго этажа — открытые, декоративные, покрыты маслом Osmo цвета «старый дуб».', img: 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?auto=format&fit=crop&w=400&q=70' },
        { num: '04', title: 'Альпийская кровля', text: 'Главная особенность шале — широкие свесы (1.2 м). Стропила из LVL-бруса, утепление 300 мм. Покрытие — композитная черепица Gerard (вместо натуральной — экономия 400 тыс. по совету Сергея). Мансардные окна Fakro в спальнях — вид на лес.', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=70' },
        { num: '05', title: 'Камин и интерьер', text: 'Камин Tulikivi — мыльный камень, аккумулирует тепло на 12 часов. Гостиная: второй свет, каменный камин от пола до потолка. Кухня: столешница из массива бука, фурнитура Blum. Полы: массив лиственницы с подогревом. Ольга выбирала каждый светильник.', img: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=400&q=70' },
        { num: '06', title: 'Террасы и сдача', text: 'Две террасы: нижняя (30 м²) с выходом из гостиной — утренний кофе с видом на сад. Верхний балкон (12 м²) — вечерний чай с закатом. Перила — кованое железо + дерево. Ландшафт: хвойные, камни, подсветка. Сдали в августе — как раз к белым ночам.', img: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=400&q=70' }
      ]
    }
  };

  const modal = document.getElementById('projectModal');
  if (modal) {
    const modalOverlay = modal.querySelector('.project-modal__overlay');
    const modalClose = modal.querySelector('.project-modal__close');

    function openProject(id) {
      const data = projectsData[id];
      if (!data) return;

      document.getElementById('modalHeroImg').src = data.heroImg;
      document.getElementById('modalHeroImg').alt = data.name;
      document.getElementById('modalTitle').textContent = 'Проект «' + data.name + '»';
      document.getElementById('modalPrice').textContent = data.price;
      document.getElementById('modalDesc').textContent = data.desc;

      // Specs
      const specsEl = document.getElementById('modalSpecs');
      specsEl.innerHTML = data.specs.map(s =>
        '<div class="project-modal__spec-item"><span class="project-modal__spec-value">' + s.value + '</span><span class="project-modal__spec-label">' + s.label + '</span></div>'
      ).join('');

      // Gallery — only this project's photos
      const galleryEl = document.getElementById('modalGallery');
      galleryEl.innerHTML = data.gallery.map((src, i) =>
        '<img src="' + src + '" alt="' + data.name + ' — фото ' + (i+1) + '" loading="lazy">'
      ).join('');

      // Story
      const storyEl = document.getElementById('modalStory');
      if (data.story) {
        storyEl.innerHTML =
          '<div class="project-story">' +
            '<div class="project-story__block">' +
              '<span class="project-story__label">Клиент</span>' +
              '<p>' + data.story.client + '</p>' +
            '</div>' +
            '<div class="project-story__block">' +
              '<span class="project-story__label">Как работали</span>' +
              '<p>' + data.story.process + '</p>' +
            '</div>' +
            '<div class="project-story__block project-story__block--result">' +
              '<span class="project-story__label">Результат</span>' +
              '<p>' + data.story.result + '</p>' +
            '</div>' +
          '</div>';
      } else {
        storyEl.innerHTML = '';
      }

      // Stages — unique per project
      const stagesEl = document.getElementById('modalStages');
      stagesEl.innerHTML = data.stages.map(st =>
        '<div class="stage-card">' +
          '<img class="stage-card__img" src="' + st.img + '" alt="' + st.title + '" loading="lazy">' +
          '<div class="stage-card__body">' +
            '<span class="stage-card__num">' + st.num + '</span>' +
            '<h4 class="stage-card__title">' + st.title + '</h4>' +
            '<p class="stage-card__text">' + st.text + '</p>' +
          '</div>' +
        '</div>'
      ).join('');

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      modal.scrollTop = 0;
    }

    function closeProject() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    // Card clicks
    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.project;
        openProject(id);
      });
    });

    // Close
    modalClose.addEventListener('click', closeProject);
    modalOverlay.addEventListener('click', closeProject);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeProject();
    });

    // CTA inside modal should close it
    modal.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', () => {
        closeProject();
      });
    });
  }

  /* ═══════════════════════════════════════
     QUIZ / CHAT
  ═══════════════════════════════════════ */
  const quizCard = document.getElementById('quizCard');
  if (!quizCard) return;

  const steps = quizCard.querySelectorAll('.quiz__step');
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');
  const totalSteps = 5;

  const quizData = {};

  // Restore from localStorage
  try {
    const saved = JSON.parse(localStorage.getItem('woodhouse_quiz') || '{}');
    Object.assign(quizData, saved);
  } catch (_) {}

  let currentStep = 1;

  function saveQuiz() {
    try { localStorage.setItem('woodhouse_quiz', JSON.stringify(quizData)); } catch (_) {}
  }

  function showStep(n, direction) {
    const prev = quizCard.querySelector('.quiz__step.active');
    const next = quizCard.querySelector(`.quiz__step[data-step="${n}"]`);
    if (!next || next === prev) return;

    if (prev) {
      prev.classList.remove('active');
      prev.classList.add('leaving');
      prev.addEventListener('animationend', () => prev.classList.remove('leaving'), { once: true });
    }

    next.style.animationDirection = direction === 'back' ? 'reverse' : 'normal';
    next.classList.add('active');

    currentStep = typeof n === 'number' ? n : totalSteps;
    const stepNum = typeof n === 'number' ? n : totalSteps;
    const pct = Math.min((stepNum / totalSteps) * 100, 100);
    progressFill.style.width = pct + '%';
    progressLabel.textContent = n === 'final' ? 'Готово' : `${stepNum} / ${totalSteps}`;
  }

  // Option click → select
  quizCard.querySelectorAll('.quiz__option').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.quiz__step');
      parent.querySelectorAll('.quiz__option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      const stepNum = parseInt(parent.dataset.step, 10);
      const key = 'step' + stepNum;
      quizData[key] = btn.dataset.value;
      saveQuiz();

      const nextBtn = parent.querySelector('.quiz__next');
      if (nextBtn) nextBtn.disabled = false;
    });
  });

  // Next
  quizCard.querySelectorAll('.quiz__next').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = btn.closest('.quiz__step');
      const stepNum = parseInt(step.dataset.step, 10);

      const fieldId = btn.dataset.field;
      if (fieldId) {
        const inp = document.getElementById(fieldId);
        if (!inp.value.trim()) {
          inp.style.borderColor = '#e05252';
          inp.focus();
          return;
        }
        inp.style.borderColor = '';
        quizData[fieldId] = inp.value.trim();
        saveQuiz();
      }

      showStep(stepNum + 1, 'forward');
    });
  });

  // Back
  quizCard.querySelectorAll('.quiz__back').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const step = btn.closest('.quiz__step');
      const stepNum = parseInt(step.dataset.step, 10);
      if (stepNum > 1) showStep(stepNum - 1, 'back');
    });
  });

  // Submit
  const submitBtn = quizCard.querySelector('.quiz__submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const fieldId = submitBtn.dataset.field;
      if (fieldId) {
        const inp = document.getElementById(fieldId);
        if (!inp.value.trim()) {
          inp.style.borderColor = '#e05252';
          inp.focus();
          return;
        }
        inp.style.borderColor = '';
        quizData[fieldId] = inp.value.trim();
      }

      saveQuiz();

      // Send quiz results to Telegram
      const now = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
      let msg = '📋 <b>Новая заявка — Квиз</b>\n';
      msg += '━━━━━━━━━━━━━━━\n';
      if (quizData.quizName)  msg += '👤 <b>Имя:</b> ' + quizData.quizName + '\n';
      if (quizData.quizPhone) msg += '📞 <b>Телефон:</b> ' + quizData.quizPhone + '\n';
      if (quizData.step2) msg += '🏡 <b>Тип дома:</b> ' + quizData.step2 + '\n';
      if (quizData.step3) msg += '📐 <b>Площадь:</b> ' + quizData.step3 + '\n';
      if (quizData.step4) msg += '📅 <b>Сроки:</b> ' + quizData.step4 + '\n';
      msg += '━━━━━━━━━━━━━━━\n';
      msg += '🕐 ' + now;

      sendToTelegram(msg);

      // Send quiz to Google Sheets
      sendToSheets({
        type: 'quiz',
        name: quizData.quizName || '',
        phone: quizData.quizPhone || '',
        houseType: quizData.step2 || '',
        area: quizData.step3 || '',
        material: quizData.step4Material || '',
        budget: quizData.step5 || '',
        deadline: quizData.step4 || '',
        options: quizData.step6 || '',
        source: 'Квиз на сайте'
      });

      try { localStorage.removeItem('woodhouse_quiz'); } catch (_) {}

      showStep('final', 'forward');
    });
  }

  // Restore saved input values
  if (quizData.quizName) {
    const el = document.getElementById('quizName');
    if (el) el.value = quizData.quizName;
  }
  if (quizData.quizPhone) {
    const el = document.getElementById('quizPhone');
    if (el) el.value = quizData.quizPhone;
  }

  /* ═══════════════════════════════════════
     GALLERY LIGHTBOX
  ═══════════════════════════════════════ */
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const galleryItems = document.querySelectorAll('.gallery__item');
    const lbImg = document.getElementById('lightboxImg');
    const lbCaption = document.getElementById('lightboxCaption');
    const lbCounter = document.getElementById('lightboxCounter');
    let currentIdx = 0;

    const galleryData = [];
    galleryItems.forEach(item => {
      const img = item.querySelector('img');
      const caption = item.querySelector('.gallery__overlay span');
      galleryData.push({
        src: img.src.replace(/w=\d+/, 'w=1200'),
        caption: caption ? caption.textContent : ''
      });
    });

    function showLightbox(idx) {
      if (idx < 0 || idx >= galleryData.length) return;
      currentIdx = idx;
      lbImg.src = galleryData[idx].src;
      lbImg.alt = galleryData[idx].caption;
      lbCaption.textContent = galleryData[idx].caption;
      lbCounter.textContent = (idx + 1) + ' / ' + galleryData.length;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }

    galleryItems.forEach((item, i) => {
      item.addEventListener('click', () => showLightbox(i));
    });

    lightbox.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox__overlay').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox__prev').addEventListener('click', () => {
      showLightbox((currentIdx - 1 + galleryData.length) % galleryData.length);
    });
    lightbox.querySelector('.lightbox__next').addEventListener('click', () => {
      showLightbox((currentIdx + 1) % galleryData.length);
    });

    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showLightbox((currentIdx - 1 + galleryData.length) % galleryData.length);
      if (e.key === 'ArrowRight') showLightbox((currentIdx + 1) % galleryData.length);
    });
  }

  /* ═══════════════════════════════════════
     SCROLL PROGRESS BAR
  ═══════════════════════════════════════ */
  const scrollProgress = document.getElementById('scrollProgress');
  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });

  /* ═══════════════════════════════════════
     STATS COUNTER ANIMATION
  ═══════════════════════════════════════ */
  const counterEls = document.querySelectorAll('.stats-strip__num');
  if (counterEls.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const step = 16;
        const increment = target / (duration / step);
        let current = 0;
        const timer = setInterval(() => {
          current = Math.min(current + increment, target);
          el.textContent = Math.floor(current) + suffix;
          if (current >= target) {
            el.textContent = target + suffix;
            clearInterval(timer);
          }
        }, step);
        counterObserver.unobserve(el);
      });
    }, { threshold: 0.5 });
    counterEls.forEach(el => counterObserver.observe(el));
  }

  /* ═══════════════════════════════════════
     FAQ ACCORDION
  ═══════════════════════════════════════ */
  document.querySelectorAll('.faq__item').forEach(item => {
    const btn = item.querySelector('.faq__question');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq__item.open').forEach(el => el.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ═══════════════════════════════════════
     PROMO COUNTDOWN TIMER
  ═══════════════════════════════════════ */
  const promoBanner = document.getElementById('promoBanner');
  const promoBannerClose = document.getElementById('promoBannerClose');

  let deadline;
  try {
    const stored = localStorage.getItem('wh_promo_deadline');
    if (stored) {
      deadline = parseInt(stored, 10);
    } else {
      deadline = Date.now() + 2 * 24 * 60 * 60 * 1000;
      localStorage.setItem('wh_promo_deadline', deadline);
    }
  } catch (_) {
    deadline = Date.now() + 2 * 24 * 60 * 60 * 1000;
  }

  function updateTimer() {
    const now = Date.now();
    let diff = Math.max(0, deadline - now);
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= d * 1000 * 60 * 60 * 24;
    const h = Math.floor(diff / (1000 * 60 * 60));
    diff -= h * 1000 * 60 * 60;
    const m = Math.floor(diff / (1000 * 60));
    diff -= m * 1000 * 60;
    const s = Math.floor(diff / 1000);
    const pad = n => String(n).padStart(2, '0');
    const tD = document.getElementById('timerD');
    const tH = document.getElementById('timerH');
    const tM = document.getElementById('timerM');
    const tS = document.getElementById('timerS');
    if (tD) tD.textContent = pad(d);
    if (tH) tH.textContent = pad(h);
    if (tM) tM.textContent = pad(m);
    if (tS) tS.textContent = pad(s);
  }
  updateTimer();
  setInterval(updateTimer, 1000);

  try {
    if (localStorage.getItem('wh_promo_closed')) {
      if (promoBanner) promoBanner.classList.add('hidden');
    }
  } catch (_) {}

  if (promoBannerClose) {
    promoBannerClose.addEventListener('click', () => {
      if (promoBanner) promoBanner.classList.add('hidden');
      try { localStorage.setItem('wh_promo_closed', '1'); } catch (_) {}
    });
  }

  /* ═══════════════════════════════════════
     EXIT INTENT POPUP
  ═══════════════════════════════════════ */
  const exitPopup = document.getElementById('exitPopup');
  const exitPopupClose = document.getElementById('exitPopupClose');
  const exitPopupOverlay = document.getElementById('exitPopupOverlay');
  const exitPopupForm = document.getElementById('exitPopupForm');
  let exitShown = false;

  function showExitPopup() {
    if (exitShown) return;
    if (!exitPopup) return;
    try { if (sessionStorage.getItem('exitPopupDismissed')) return; } catch (_) {}
    exitShown = true;
    exitPopup.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeExitPopup() {
    if (!exitPopup) return;
    exitPopup.classList.remove('active');
    document.body.style.overflow = '';
    try { sessionStorage.setItem('exitPopupDismissed', '1'); } catch (_) {}
  }

  document.addEventListener('mouseleave', e => {
    if (e.clientY <= 0) showExitPopup();
  });
  setTimeout(() => showExitPopup(), 45000);

  if (exitPopupClose) exitPopupClose.addEventListener('click', closeExitPopup);
  if (exitPopupOverlay) exitPopupOverlay.addEventListener('click', closeExitPopup);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && exitPopup && exitPopup.classList.contains('active')) closeExitPopup();
  });

  if (exitPopupForm) {
    exitPopupForm.addEventListener('submit', e => {
      e.preventDefault();
      const phone = document.getElementById('exitPhone');
      if (!phone || !phone.value.trim()) { if (phone) phone.style.borderColor = '#e05252'; return; }
      const now = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
      const msg = '🎁 <b>Поп-ап скидки — заявка</b>\n━━━━━━━━━━━━━━━\n📞 <b>Телефон:</b> ' + phone.value.trim() + '\n💬 Запросил скидку 5%\n━━━━━━━━━━━━━━━\n🕐 ' + now;
      sendToTelegram(msg);
      exitPopupForm.innerHTML = '<p style="color:var(--c-green-light);font-size:1.1rem;padding:20px 0;text-align:center">✅ Отлично! Перезвоним в течение 15 минут.</p>';
      setTimeout(closeExitPopup, 3000);
    });
  }

  /* ═══════════════════════════════════════
     LEAFLET MAP
  ═══════════════════════════════════════ */
  function initLeafletMap() {
    const mapEl = document.getElementById('russiaMap');
    if (!mapEl || typeof L === 'undefined') return;
    if (mapEl._leaflet_id) return; // already initialized

    const map = L.map('russiaMap', {
      center: [60, 85],
      zoom: 4,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: false
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 10 }).addTo(map);

    const makeIcon = (color, glowColor) => L.divIcon({
      className: '',
      html: `<div style="width:14px;height:14px;background:${color};border:3px solid ${glowColor};border-radius:50%;box-shadow:0 0 12px ${glowColor}"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7]
    });
    const builtIcon  = makeIcon('#4A7C59', 'rgba(74,124,89,0.6)');
    const activeIcon = makeIcon('#C8973C', 'rgba(200,151,60,0.6)');

    const builtProjects = [
      [55.75, 37.62, 'Москва', 'Проект «Лесной»'],
      [59.93, 30.32, 'Санкт-Петербург', 'Проект «Шале»'],
      [56.85, 60.61, 'Екатеринбург', 'Проект «Сибирский»'],
      [56.01, 92.87, 'Красноярск', 'Проект «Премиум»'],
      [54.19, 37.62, 'Тула', 'Проект «Дачный»'],
      [55.79, 49.12, 'Казань', 'Проект «Скандинавский»'],
      [58.60, 49.67, 'Киров', 'Проект «Лесной»'],
      [51.66, 39.19, 'Воронеж', 'Проект «Дачный»'],
      [57.15, 65.53, 'Тюмень', 'Проект «Сибирский»'],
      [53.20, 50.15, 'Самара', 'Проект «Скандинавский»'],
      [54.73, 55.94, 'Уфа', 'Проект «Лесной»'],
      [55.16, 61.40, 'Челябинск', 'Проект «Шале»'],
      [53.54, 108.98, 'Иркутск', 'Проект «Сибирский»'],
      [43.11, 131.87, 'Владивосток', 'Проект «Премиум»'],
      [48.70, 44.52, 'Волгоград', 'Проект «Дачный»'],
      [44.97, 41.93, 'Ставрополь', 'Проект «Скандинавский»'],
      [56.32, 44.00, 'Нижний Новгород', 'Проект «Лесной»'],
      [52.97, 36.06, 'Орёл', 'Проект «Дачный»'],
      [57.63, 39.87, 'Ярославль', 'Проект «Шале»'],
      [60.72, 28.75, 'Выборг', 'Проект «Скандинавский»'],
      [67.54, 64.05, 'Воркута', 'Проект «Сибирский»'],
      [61.67, 50.84, 'Сыктывкар', 'Проект «Лесной»'],
      [68.97, 33.07, 'Мурманск', 'Проект «Сибирский»'],
      [47.23, 39.72, 'Ростов-на-Дону', 'Проект «Скандинавский»'],
      [55.04, 82.93, 'Новосибирск', 'Проект «Премиум»']
    ];
    const activeProjects = [
      [56.49, 84.98, 'Томск', 'Строится «Лесной»'],
      [54.98, 73.37, 'Омск', 'Строится «Премиум»'],
      [45.05, 38.97, 'Краснодар', 'Строится «Шале»'],
      [61.78, 34.36, 'Петрозаводск', 'Строится «Скандинавский»'],
      [66.54, 66.60, 'Надым', 'Строится «Сибирский»']
    ];

    builtProjects.forEach(([lat, lng, city, project]) => {
      L.marker([lat, lng], { icon: builtIcon })
        .addTo(map)
        .bindPopup('<b>' + project + '</b><br><span style="color:#999">' + city + '</span>');
    });
    activeProjects.forEach(([lat, lng, city, project]) => {
      L.marker([lat, lng], { icon: activeIcon })
        .addTo(map)
        .bindPopup('<b>' + project + '</b><br><span style="color:#999">' + city + '</span>');
    });
  }

  if (typeof L !== 'undefined') {
    initLeafletMap();
  } else {
    window.addEventListener('load', initLeafletMap);
  }

});
