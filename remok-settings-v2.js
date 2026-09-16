/* REMOK Tilda static entry. No build system or ES modules required. */
(function () {
  'use strict';
  const bootKey = Symbol.for('remok.settings.bootstrap');
  if (document[bootKey]) return;
  const lifecycle = document[bootKey] = { status: 'waiting', observer: null };
  function start() {
    const root = document.getElementById('remok-estimator');
    if (!root || !root.querySelector('#remok-settings')) return false;
    if (lifecycle.status !== 'waiting') return true;
    lifecycle.status = 'starting';
    lifecycle.observer?.disconnect();
    try {
      initialize();
      lifecycle.status = 'ready';
    } catch (error) {
      lifecycle.status = 'failed';
      const message = document.createElement('p');
      message.className = 'remok-error';
      message.setAttribute('role', 'alert');
      message.textContent = 'Не удалось запустить REMOK. Обновите страницу.';
      root.prepend(message);
      console.error('REMOK initialization failed', error);
    }
    return true;
  }
  function ready() {
    if (!start()) {
      lifecycle.observer = new MutationObserver(start);
      lifecycle.observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
  function initialize() {
// ===== config =====
(function () {
  'use strict';
  const R = window.Remok = window.Remok || {};
  R.labels = {
    types: { 'balcony-glazing': 'Остекление балкона', glazing: 'Пластиковое остекление', aluminum: 'Алюминиевое остекление', finish: 'Отделка окна' },
    lamination: { none: 'Без ламинации', one: 'Односторонняя ламинация', two: 'Двусторонняя ламинация' },
    aluminumColors: { white: 'Белый', color: 'Цветной' },
    profiles: { exprof: 'Exprof XS570 Siberica', veka: 'VEKA Softline 70', rehau: 'REHAU Sib-Design' },
    exterior: { aquilon: 'Аквилон крашеный', corner1: 'Уголок — 1 контур', corner2: 'Уголок — 2 контура' },
    interior: {
      sandwich_bfk: 'Сэндвич-откосы + подоконник БФК', sandwich_bfk_paint: 'Сэндвич-откосы + БФК + полная покраска',
      sandwich_moller: 'Сэндвич-откосы + подоконник Möller', qunell_white_bfk: 'Qunell белый + подоконник БФК',
      qunell_white_moller: 'Qunell белый + подоконник Möller', qunell_white_moller_ld: 'Qunell белый + подоконник Möller LD',
      qunell_color_moller: 'Qunell цветной + подоконник Möller', sandwich: 'Только сэндвич-откосы',
      sandwich_paint: 'Сэндвич-откосы + покраска', qunell_white: 'Только Qunell белый', qunell_color: 'Только Qunell цветной',
      bfk: 'Только подоконник БФК', bfk_paint: 'Подоконник БФК + покраска', moller: 'Только подоконник Möller'
    },
    walls: { pvc: 'ПВХ панели', mdf: 'МДФ', optima: 'Вагонка Оптима', norma: 'Вагонка Норма' },
    floor: { laminate: 'Ламинат', kvp: 'Кварцвинил', linoleum: 'Линолеум' },
    sections: { walls: 'Стены', floor: 'Пол', ceiling: 'Потолок', electricity: 'Электрика', warmFloor: 'Тёплый пол' }
  };
  R.company = {
    name: 'ООО «Ремок»', inn: '5407978699', kpp: '540701001', ogrn: '1205400031616',
    phone: '+7 905 955-50-06', email: 'info@remok.net',
    address: '630132, Новосибирская область, г. Новосибирск, ул. Челюскинцев, д. 36/1, офис 509'
  };
  R.DEFAULT_PRICING = {
    hardwareDefault: 'Стандартная',
    installationDisplayRatePerM2: 3000, sandwichDiscountPerM2: 1000,
    lamination: { oneSideLaminationCoefficient: 1.3, twoSideLaminationCoefficient: 1.5 },
    aluminum: { aluminumRate: 13000, aluminumColorCoefficient: 1.4 },
    glazing: { exprof: 16500, veka: 18000, rehau: 22000 },
    exterior: { aquilonRate: 6000, aquilonFixed: 2800, aquilonExtra: 0.16, corner1Rate: 300, corner2Rate: 600, cornerFixed: 4500, metalExtra: 0.06 },
    interior: { sillExtra: 0.2, bfkRate: 1400, bfkFixed: 200, mollerRate: 8300, mollerLDRate: 15300, mollerFixed: 250,
      sandwichRate: 500, sandwichFixed: 240, qunellWhiteRate: 2000, qunellColorRate: 6200, qunellFixed: 200,
      whiteExtra: 440, colorExtra: 880, sandwichDivisor: 0.5, qunellDivisor: 0.65, bfkDivisor: 0.4,
      work2500: 2500, work3000: 3000, work3500: 3500, work1500: 1500, paintMultiplier: 1.1, paintRate: 2500, multiplier: 1.2 },
    balcony: {
      walls: { pvc: { withoutInsulation: 1000, withInsulation: 1775 }, mdf: { withoutInsulation: 1155, withInsulation: 1930 }, optima: { withoutInsulation: 2475, withInsulation: 3255 }, norma: { withoutInsulation: 1420, withInsulation: 2200 } },
      floor: { laminate: { withoutInsulation: 3090, withInsulation: 3865 }, kvp: { withoutInsulation: 3880, withInsulation: 4660 }, linoleum: { withoutInsulation: 2955, withInsulation: 3740 } },
      work: { withoutInsulation: 6000, withInsulation: 7500 }, divisor: 0.75,
      electricity: { base: 5000, point: 2000 }, warmFloor: { base: 5000, rate: 1600 }
    }
  };
  // Stable IDs retain compatibility with the previous fixed glazing keys.
  R.DEFAULT_PRICING.pvcProfiles = Object.entries(R.labels.profiles).map(([id,name]) => ({id,name,pricePerM2:R.DEFAULT_PRICING.glazing[id]}));
  R.profiles = {
    adapt(pricing, saved) {
      const source=Array.isArray(saved?.pvcProfiles)?saved.pvcProfiles:R.DEFAULT_PRICING.pvcProfiles.map(p=>({...p,pricePerM2:pricing.glazing[p.id]}));
      const ids=new Set();
      pricing.pvcProfiles=source.filter(p=>p&&typeof p.id==='string'&&/^[a-zA-Z0-9_-]+$/.test(p.id)&&!['__proto__','constructor','prototype'].includes(p.id)&&typeof p.name==='string'&&p.name.trim()&&typeof p.pricePerM2==='number'&&Number.isFinite(p.pricePerM2)&&p.pricePerM2>=0&&!ids.has(p.id)&&ids.add(p.id)).map(p=>({id:p.id,name:p.name.trim(),pricePerM2:p.pricePerM2}));
      pricing.glazing=Object.fromEntries(pricing.pvcProfiles.map(p=>[p.id,p.pricePerM2]));
      R.labels.profiles=Object.fromEntries(pricing.pvcProfiles.map(p=>[p.id,p.name]));
      return pricing;
    },
    resolve(item, pricing=R.storage.pricing()) {
      const active=pricing.pvcProfiles?.find(p=>p.id===item.profile);
      const snapshot=item.profileSnapshot;
      return active || (snapshot?.id===item.profile&&typeof snapshot.name==='string'&&typeof snapshot.pricePerM2==='number'&&Number.isFinite(snapshot.pricePerM2)&&snapshot.pricePerM2>=0?snapshot:null);
    },
    name(item,pricing) {return R.profiles.resolve(item,pricing)?.name || 'Не указан';},
    capture(item,pricing) {if(item.mode==='glazing'||item.mode==='balcony-glazing'&&item.balconyGlazingMaterial==='pvc'){const p=R.profiles.resolve(item,pricing);if(p)item.profileSnapshot={...p};}},
    forItem(item,pricing) {const p=R.profiles.resolve(item,pricing);return p?{...pricing,glazing:{...pricing.glazing,[p.id]:p.pricePerM2}}:pricing;},
    options(item,pricing) {const list=pricing.pvcProfiles.map(p=>[p.id,p.name]);const p=R.profiles.resolve(item,pricing);if(p&&!list.some(([id])=>id===p.id))list.push([p.id,p.name+' (удалён из настроек)']);return Object.fromEntries(list);}
  };

})();

// ===== storage =====
(function () {
  'use strict';
  const R = window.Remok;
  const keys = { pricing: 'remok.estimator.pricing.v1', estimate: 'remok.estimator.estimate.v1' };
  function read(key) { try { return JSON.parse(localStorage.getItem(keys[key])); } catch (_) { return null; } }
  function write(key, value) {
    try { localStorage.setItem(keys[key], JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }
  function merge(defaults, saved) {
    const result = {};
    Object.keys(defaults).forEach(k => {
      const d = defaults[k], s = saved && saved[k];
      result[k] = typeof d === 'object' ? merge(d, s) : typeof d === 'string' ? (typeof s === 'string' && s.trim() ? s.trim() : d) : typeof s === 'number' && Number.isFinite(s) && s >= 0 && (!/divisor/i.test(k) || s > 0) ? s : d;
    });
    return result;
  }
  R.storage = { read, write, pricing: () => { const saved=read('pricing'); return R.profiles.adapt(merge(R.DEFAULT_PRICING, saved), saved); } };
})();

// ===== settings =====
(function () {
  'use strict';
  const R = window.Remok;
  let pricing = R.storage.pricing();
  const form = document.getElementById('remok-settings'), fields = document.getElementById('remok-price-fields'), status = document.getElementById('remok-settings-status');
  const exteriorLabels = { aquilonRate: 'Аквилон: ставка, ₽', aquilonFixed: 'Аквилон: фиксированная часть, ₽', aquilonExtra: 'Аквилон: прибавка к глубине, м', corner1Rate: 'Уголок — 1 контур: ставка, ₽/м', corner2Rate: 'Уголок — 2 контура: ставка, ₽/м', cornerFixed: 'Уголок: фиксированная часть, ₽', metalExtra: 'Служебная прибавка для площади металла, м' };
  const interiorLabels = { sillExtra: 'Прибавка к ширине подоконника, м', bfkRate: 'БФК: ставка', bfkFixed: 'БФК: постоянная часть', mollerRate: 'Möller: ставка', mollerLDRate: 'Möller LD: ставка', mollerFixed: 'Möller: постоянная часть', sandwichRate: 'Сэндвич: ставка', sandwichFixed: 'Сэндвич: постоянная часть', qunellWhiteRate: 'Qunell белый: ставка', qunellColorRate: 'Qunell цветной: ставка', qunellFixed: 'Qunell: постоянная часть', whiteExtra: 'Qunell белый: доплата', colorExtra: 'Qunell цветной: доплата', sandwichDivisor: 'Сэндвич: делитель', qunellDivisor: 'Qunell / Möller: делитель', bfkDivisor: 'Отдельный БФК: делитель', work2500: 'Работа: базовая группа 2500', work3000: 'Работа: базовая группа 3000', work3500: 'Работа: базовая группа 3500', work1500: 'Работа: базовая группа 1500', paintMultiplier: 'Внутренний множитель покраски', paintRate: 'Покраска: ставка, ₽/м²', multiplier: 'Финальный множитель' };
  function get(path) { return path.split('.').reduce((o, k) => o[k], pricing); }
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function field(path, label) { if (path === 'hardwareDefault' || path.endsWith('.name')) return `<label class="remok-field">${label}<input type="text" required data-price="${path}" value="${esc(get(path))}"></label>`; return `<label class="remok-field">${label}<input type="number" inputmode="decimal" step="any" min="${/divisor/i.test(path) ? '0.000001' : '0'}" required data-price="${path}" value="${get(path)}"></label>`; }
  function section(title, content) { return `<section class="remok-card"><h2>${title}</h2><div class="remok-grid">${content}</div></section>`; }
  function render() {
    fields.innerHTML = `<section class="remok-card"><h2>Пластиковые профили</h2>${pricing.pvcProfiles.map((p,i)=>`<div class="remok-profile-row"><div class="remok-grid">${field('pvcProfiles.'+i+'.name','Название профиля')}${field('pvcProfiles.'+i+'.pricePerM2','Цена, ₽/м²')}</div><button type="button" data-delete-profile="${esc(p.id)}">Удалить профиль</button></div>`).join('')}<button type="button" data-add-profile>+ Добавить профиль</button></section>`
      + section('Монтаж и заполнение', field('installationDisplayRatePerM2', 'Монтаж с расходными материалами, ₽/м² (выделяется из цены)') + field('sandwichDiscountPerM2', 'Снижение стоимости при сэндвич-панели, ₽/м²'))
      + section('Фурнитура', field('hardwareDefault', 'Фурнитура по умолчанию'))
      + section('Ламинация ПВХ', field('lamination.oneSideLaminationCoefficient', 'Односторонняя ламинация, коэффициент') + field('lamination.twoSideLaminationCoefficient', 'Двусторонняя ламинация, коэффициент'))
      + section('Алюминиевое остекление', field('aluminum.aluminumRate', 'Холодный белый алюминий, ₽/м²') + field('aluminum.aluminumColorCoefficient', 'Коэффициент цветного алюминия'))
      + section('Наружная отделка', Object.entries(exteriorLabels).map(([k, v]) => field('exterior.' + k, v)).join(''))
      + `<details class="remok-card"><summary>Внутренняя отделка · коэффициенты формул</summary><p class="remok-help">Общие коэффициенты используются в нескольких вариантах отделки. Названия групп работ соответствуют исходным формулам.</p><div class="remok-grid">${Object.entries(interiorLabels).map(([k, v]) => field('interior.' + k, v)).join('')}</div></details>`
      + section('Балкон · стены и потолок', Object.entries(R.labels.walls).map(([k, v]) => field('balcony.walls.' + k + '.withoutInsulation', v + ' без утепления, ₽/м²') + field('balcony.walls.' + k + '.withInsulation', v + ' с утеплением, ₽/м²')).join(''))
      + section('Балкон · пол', Object.entries(R.labels.floor).map(([k, v]) => field('balcony.floor.' + k + '.withoutInsulation', v + ' без утепления, ₽/м²') + field('balcony.floor.' + k + '.withInsulation', v + ' с утеплением, ₽/м²')).join(''))
      + section('Балкон · работа на каждой поверхности', field('balcony.work.withoutInsulation', 'Без утепления, ₽') + field('balcony.work.withInsulation', 'С утеплением, ₽') + field('balcony.divisor', 'Делитель стоимости'))
      + section('Электрика', field('balcony.electricity.base', 'Завести электрику, ₽') + field('balcony.electricity.point', 'Одна точка, ₽'))
      + section('Тёплый пол', field('balcony.warmFloor.base', 'Фиксированная часть, ₽') + field('balcony.warmFloor.rate', 'Стоимость за м², ₽'));
  }
  function collectDraft() {
    fields.querySelectorAll('[data-price]').forEach(el=>{const keys=el.dataset.price.split('.'),key=keys.pop();keys.reduce((o,k)=>o[k],pricing)[key]=el.type==='text'?el.value:el.value===''?'':Number(el.value);});
  }
  function preserveSnapshots() {
    const estimate=R.storage.read('estimate');if(!estimate)return true;
    const previous=R.storage.pricing();
    (estimate.items||[]).forEach(item=>R.profiles.capture(item,previous));if(estimate.draft)R.profiles.capture(estimate.draft,previous);
    if(R.storage.write('estimate',estimate))return true;
    status.textContent='Не удалось сохранить параметры профилей в текущем замере. Настройки не изменены.';return false;
  }
  fields.addEventListener('click',e=>{
    const add=e.target.closest('[data-add-profile]'),remove=e.target.closest('[data-delete-profile]');if(!add&&!remove)return;
    collectDraft();
    if(add)pricing.pvcProfiles.push({id:'pvc-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)),name:'Новый профиль',pricePerM2:0});
    else pricing.pvcProfiles=pricing.pvcProfiles.filter(p=>p.id!==remove.dataset.deleteProfile);
    render();
  });
  form.addEventListener('submit' , e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    for (const el of fields.querySelectorAll('[data-price]')) {
      const value = el.type === 'text' ? el.value.trim() : Number(el.value); if (el.type === 'text' ? !value : !Number.isFinite(value)) { status.textContent = 'Проверьте числовые значения.'; return; }
      const parts = el.dataset.price.split('.'), key = parts.pop(); parts.reduce((o, k) => o[k], pricing)[key] = value;
    }
    if (!preserveSnapshots()) return;
    pricing=R.profiles.adapt(pricing,pricing);
    const ok = R.storage.write('pricing', pricing);
    status.textContent = ok ? '✓ Настройки сохранены. Можно вернуться к замеру.' : 'Не удалось сохранить настройки в браузере.';
    status.className = ok ? 'remok-success' : 'remok-error';
  });
  document.getElementById('remok-reset').addEventListener('click', () => {
    if (!confirm('Вернуть значения цен по умолчанию? Текущие настройки будут заменены.')) return;
    if (!preserveSnapshots()) return;
    pricing = JSON.parse(JSON.stringify(R.DEFAULT_PRICING));
    pricing=R.profiles.adapt(pricing,pricing);
    const ok = R.storage.write('pricing', pricing); render();
    status.textContent = ok ? 'Значения по умолчанию восстановлены и сохранены.' : 'Не удалось сохранить настройки в браузере.';
    status.className = ok ? 'remok-success' : 'remok-error';
  });
  render();
})();
  }
})();
