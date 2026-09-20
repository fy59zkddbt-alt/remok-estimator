/* REMOK Tilda static entry. No build system or ES modules required. */
(function () {
  'use strict';
  const bootKey = Symbol.for('remok.estimator.bootstrap');
  if (document[bootKey]) return;
  const lifecycle = document[bootKey] = { status: 'waiting', observer: null };
  function start() {
    const root = document.getElementById('remok-estimator');
    if (!root || !root.querySelector('#remok-main')) return false;
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

// ===== calculators =====
(function () {
  'use strict';
  const R = window.Remok;
  const positive = n => Number.isFinite(Number(n)) && Number(n) > 0;
  const nonnegative = n => n !== '' && Number.isFinite(Number(n)) && Number(n) >= 0;
  const area = (w, h) => positive(w) && positive(h) ? Number(w) * Number(h) / 1000000 : null;
  const round100 = n => Math.round(n / 100) * 100;
  function calculateGlazing(width, height, profile, pricing, lamination = 'none') {
    const a = area(width, height);
    const coefficients = { none: 1, one: pricing.lamination.oneSideLaminationCoefficient, two: pricing.lamination.twoSideLaminationCoefficient };
    return a === null || !(profile in pricing.glazing) || !(lamination in coefficients) ? null : a * pricing.glazing[profile] * coefficients[lamination];
  }
  function calculateAluminum(width, height, color, pricing) {
    const a = area(width, height);
    if (a === null || !['white', 'color'].includes(color)) return null;
    return a * pricing.aluminum.aluminumRate * (color === 'color' ? pricing.aluminum.aluminumColorCoefficient : 1);
  }
  function glazingDetail(item) {
    if (item.mode === 'aluminum') return 'Холодное алюминиевое остекление, ' + (item.aluminumColor === 'color' ? 'цветное' : 'белое');
    return R.labels.profiles[item.profile] + (item.lamination && item.lamination !== 'none' ? ' · ' + R.labels.lamination[item.lamination] : '');
  }
  function calculateExterior(width, height, depth, type, pricing) {
    if (area(width, height) === null || !positive(depth)) return null;
    const w = width / 1000, h = height / 1000, d = depth / 1000, p = pricing.exterior;
    if (type === 'aquilon') return (w + h) * (d + p.aquilonExtra) * p.aquilonRate + p.aquilonFixed;
    if (type === 'corner1' || type === 'corner2') return (2 * w + 2 * h) * p[type + 'Rate'] + p.cornerFixed;
    return null;
  }
  function calculateInterior(width, height, depth, type, pricing) {
    if (area(width, height) === null || !positive(depth)) return null;
    const w = width / 1000, h = height / 1000, d = depth / 1000, p = pricing.interior;
    const sill = w + p.sillExtra, contour = w + 2 * h;
    const bfk = sill * (p.bfkRate * d + p.bfkFixed);
    const moller = sill * (p.mollerRate * d + p.mollerFixed);
    const ld = sill * (p.mollerLDRate * d + p.mollerFixed);
    const sandwich = contour * (p.sandwichRate * d + p.sandwichFixed);
    const white = contour * (p.qunellWhiteRate * d + p.qunellFixed);
    const color = contour * (p.qunellColorRate * d + p.qunellFixed);
    const base = (bfk + sandwich) / p.sandwichDivisor + p.work2500;
    const slopes = sandwich / p.sandwichDivisor + p.work2500;
    const sillBase = bfk / p.bfkDivisor + p.work1500;
    const values = {
      sandwich_bfk: base,
      sandwich_bfk_paint: base * p.paintMultiplier + (sill + contour) * d * p.paintRate,
      sandwich_moller: (moller + sandwich) / p.qunellDivisor + p.work3000,
      qunell_white_bfk: (bfk + white + p.whiteExtra) / p.qunellDivisor + p.work3000,
      qunell_white_moller: (moller + white + p.whiteExtra) / p.qunellDivisor + p.work3500,
      qunell_white_moller_ld: (ld + white + p.whiteExtra) / p.qunellDivisor + p.work3500,
      qunell_color_moller: (moller + color + p.colorExtra) / p.qunellDivisor + p.work3500,
      sandwich: slopes,
      sandwich_paint: slopes * p.paintMultiplier + contour * d * p.paintRate,
      qunell_white: (white + p.whiteExtra) / p.qunellDivisor + p.work3500,
      qunell_color: (color + p.colorExtra) / p.qunellDivisor + p.work3500,
      bfk: sillBase,
      bfk_paint: sillBase * p.paintMultiplier + sill * d * p.paintRate,
      moller: moller / p.qunellDivisor + p.work2500
    };
    return type in values ? values[type] * p.multiplier : null;
  }
  function calculateBalconySurface(netArea, material, insulated, kind, pricing) {
    const p = pricing.balcony, key = insulated ? 'withInsulation' : 'withoutInsulation';
    if (!nonnegative(netArea) || !p[kind]?.[material]) return null;
    return round100((netArea * p[kind][material][key] + p.work[key]) / p.divisor);
  }
  function calculateWall(wall, material, insulated, pricing) {
    const gross = area(wall.width, wall.height);
    const openings = wall.hasOpenings ? wall.openings.map(o => area(o.width, o.height)) : [];
    if (gross === null || openings.some(a => a === null)) return { error: 'Заполните размеры стены и всех проёмов.' };
    const deducted = openings.reduce((s, a) => s + a, 0), net = gross - deducted;
    if (net < -1e-9) return { error: 'Площадь проёмов больше площади стены.' };
    return { gross, openings: deducted, net: Math.max(0, net), price: calculateBalconySurface(Math.max(0, net), material, insulated, 'walls', pricing) };
  }
  function calculateElectricity(base, points, pricing) {
    return nonnegative(points) && Number.isInteger(Number(points)) ? (base ? pricing.balcony.electricity.base : 0) + points * pricing.balcony.electricity.point : null;
  }
  function calculateWarmFloor(floorArea, pricing) {
    return positive(floorArea) ? pricing.balcony.warmFloor.base + floorArea * pricing.balcony.warmFloor.rate : null;
  }
  function product(item, pricing) {
    const lines = [], errors = [];
    if (area(item.width, item.height) === null) errors.push('Укажите положительные ширину и высоту изделия.');
    if (item.mode === 'glazing' || item.mode === 'aluminum') {
      const price = item.mode === 'aluminum' ? calculateAluminum(item.width, item.height, item.aluminumColor || 'white', pricing) : calculateGlazing(item.width, item.height, item.profile, pricing, item.lamination || 'none');
      if (price === null) errors.push(item.mode === 'aluminum' ? 'Выберите цвет алюминия.' : 'Выберите профиль и ламинацию.');
      else lines.push({ title: 'Остекление', detail: glazingDetail(item), price });
    }
    ['exterior', 'interior'].forEach(key => {
      const part = item[key], title = key === 'exterior' ? 'Наружная отделка' : 'Внутренняя отделка';
      if (part.enabled === null) errors.push('Ответьте на вопрос: ' + title.toLowerCase() + '.');
      if (!part.enabled) return;
      const price = (key === 'exterior' ? calculateExterior : calculateInterior)(item.width, item.height, part.depth, part.type, pricing);
      if (price === null) errors.push(title + ': укажите глубину и вариант.');
      if (!part.depthChecked) errors.push(title + ': подтвердите проверку глубины.');
      if (part.hasDepthDifference && !part.comment.trim()) errors.push(title + ': опишите расхождение глубины.');
      if (price !== null) lines.push({ title, detail: R.labels[key][part.type] + ' · Глубина: ' + part.depth + ' мм', comment: part.hasDepthDifference ? part.comment : '', price });
    });
    if (item.mode === 'finish' && !item.exterior.enabled && !item.interior.enabled) errors.push('Выберите вид отделки.');
    return { lines, errors, total: lines.reduce((s, l) => s + l.price, 0) };
  }
  function balcony(b, pricing) {
    const lines = [], errors = [];
    if (!b.enabled) return { lines, errors, total: 0 };
    if (!Object.keys(R.labels.sections).some(k => b[k].enabled)) errors.push('Выберите хотя бы один вид работ.');
    if (b.walls.enabled) {
      const results = b.walls.items.map(w => calculateWall(w, b.walls.material, b.walls.insulated, pricing));
      if (!results.length) errors.push('Добавьте стену.');
      results.forEach((r, i) => { if (r.error) errors.push('Стена №' + (i + 1) + ': ' + r.error); });
      if (results.length && results.every(r => !r.error)) lines.push({ title: 'Стены', detail: R.labels.walls[b.walls.material] + (b.walls.insulated ? ', с утеплением' : ', без утепления'), area: results.reduce((s, r) => s + r.net, 0), price: results.reduce((s, r) => s + r.price, 0) });
    }
    ['floor', 'ceiling'].forEach(k => {
      const part = b[k];
      if (!part.enabled) return;
      const a = area(part.length, part.width);
      if (a === null) errors.push(R.labels.sections[k] + ': укажите размеры.');
      else lines.push({ title: R.labels.sections[k], detail: R.labels[k === 'floor' ? 'floor' : 'walls'][part.material] + (part.insulated ? ', с утеплением' : ', без утепления'), area: a, price: calculateBalconySurface(a, part.material, part.insulated, k === 'floor' ? 'floor' : 'walls', pricing) });
    });
    if (b.electricity.enabled) {
      const e = b.electricity, price = calculateElectricity(e.base, e.addPoints ? e.points : 0, pricing);
      if (price === null || (!e.base && !e.addPoints) || (e.addPoints && !positive(e.points))) errors.push('Электрика: выберите ввод или укажите целое положительное количество точек.');
      else lines.push({ title: 'Электрика', detail: (e.base ? 'Ввод' : 'Без ввода') + (e.addPoints ? ' + ' + e.points + ' точек' : ''), price });
    }
    if (b.warmFloor.enabled) {
      const a = area(b.floor.length, b.floor.width), price = calculateWarmFloor(a, pricing);
      if (price === null) errors.push('Для расчета тёплого пола укажите размеры пола.');
      else lines.push({ title: 'Тёплый пол', area: a, detail: '', price });
    }
    return { lines, errors, total: lines.reduce((s, l) => s + l.price, 0) };
  }
  R.calc = { positive, nonnegative, area, round100, calculateGlazing, calculateAluminum, glazingDetail, calculateExterior, calculateInterior, calculateBalconySurface, calculateWall, calculateElectricity, calculateWarmFloor, product, balcony };
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

// ===== font-data =====
/* Remok Sans: subset of Noto Sans, SIL Open Font License 1.1.
Copyright 2018 The Noto Project Authors (github.com/googlei18n/noto-fonts)

This Font Software is licensed under the SIL Open Font License,
Version 1.1.

This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL

-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font
creation efforts of academic and linguistic communities, and to
provide a free and open framework in which fonts may be shared and
improved in partnership with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply to
any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software
components as distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to,
deleting, or substituting -- in part or in whole -- any of the
components of the Original Version, by changing formats or by porting
the Font Software to a new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed,
modify, redistribute, and sell modified and unmodified copies of the
Font Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components, in
Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the
corresponding Copyright Holder. This restriction only applies to the
primary font name as presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created using
the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.

*/
(function(){ window.Remok = window.Remok || {}; window.Remok.pdfFonts = {"regular": [
  "AAEAAAASAQAABAAgR0RFRhuJGVwAAcmUAAAAeEdQT1NEdkx1AAHKDAAAACBHU1VCkxWCFgAByiwAAAA2T1MvMmu43UUAAAGoAAAAYFNUQVRI7zu8AAHKZAAA",
  "AP5jbWFwbMLtMQAAETQAAAKOY3Z0ID4MGzQAACLkAAABLGZwZ22eNhnaAAATxAAADhVnYXNwAAAAEAAByYwAAAAIZ2x5ZoN6ACAAACu8AAGaBGhlYWQnDIgJ",
  "AAABLAAAADZoaGVhB9EGbQAAAWQAAAAkaG10eJ1rmccAAAIIAAAPLGxvY2E9f9XxAAAkEAAAB6ptYXhwBpUP3QAAAYgAAAAgbmFtZW/qoTQAAcXAAAADrHBv",
  "c3T/nwAyAAHJbAAAACBwcmVwRH7GuQAAIdwAAAEFAAEAAAACAgxpRI2xXw889QAHA+gAAAAA3YDT5wAAAADmzm4o/cf+6AXaBCMAAAAGAAIAAAAAAAAAAQAA",
  "BC3+2wAABgj9x/3HBdoAAQAAAAAAAAAAAAAAAAAAA8IAAQAAA9QAcAAJAFgABQACAJgA/ACNAAABiQ4VAAQAAgAEAkYBkAAFAAACigJYAAAASwKKAlgAAAFe",
  "ADIBQgAAAgsFAgQFBAICBIAAAg8AAAAKAAAAIAAAAABHT09HAEAAIP/9BC3+2wAABC0BJQAAAJcAAAAAAhgCygAAACAABAJYAF4BBAAAAQ0ASAGYAEEChgAZ",
  "AjwAPgM/ADEC3AA1AOEAQQEsACgBLAAeAicAKQI8ADIBDAApAUIAKAEMAEgBdAAKAjwAMQI8AFkCPAAwAjwALQI8ABUCPAA/AjwANwI8ACwCPAAxAjwAMgEM",
  "AEgBDAAfAjwAMgI8ADgCPAAyAbIADAODADoCfwAAAooAYQJ4AD0C2gBhAiwAYQIHAGEC2AA9AuUAYQFTACgBEf+yAmsAYQIMAGEDiwBhAvgAYQMNAD0CXQBh",
  "Aw0APQJuAGECJQAzAiwACgLbAFoCWAAAA6IADAJKAAQCNgAAAjwAJgFJAFABdAAKAUkAGQI8ACYBvP/+ARkAKAIxAC4CZwBVAeAANwJnADcCNAA3AVgADwJn",
  "ADcCagBVAQIATgEC/8kCFgBVAQIAVQOnAFUCagBVAl0ANwJnAFUCZwA3AZ0AVQHfADMBaQAQAmoATwH8AAADEgALAhEAEgH+AAEB1gAnAXwAHAInAO8BfAAg",
  "AjwAMgEEAAABDQBIAjwAWwI8ACACPAA7AjwADgInAO8CAQA7AkQAlQNAADEBZQAgAf0AKAI8ADIBQgAoA0AAMQH0//0BrAA3AjwAMgFeABgBXgARARkAKAJv",
  "AFUCjwA3AQwASADhAA4BXgAlAXgAIAH9ACcC6QAiAwMAFgMNAA8BsgAYAn8AAAJ/AAACfwAAAn8AAAJ/AAACfwAAA3H//wJ4AD0CLABhAiwAYQIsAGECLABh",
  "AVMAKAFTACgBUwABAVMAHgLaAB4C+ABhAw0APQMNAD0DDQA9Aw0APQMNAD0CPABAAw0APQLbAFoC2wBaAtsAWgLbAFoCNgAAAl0AYQJ3AFUCMQAuAjEALgIx",
  "AC4CMQAuAjEALgIxAC4DYAAuAeAANwI0ADcCNAA3AjQANwI0ADcBAv//AQIATAEC/9gBAv/1Al0ANwJqAFUCXQA3Al0ANwJdADcCXQA3Al0ANwI8ADICXQA3",
  "AmoATwJqAE8CagBPAmoATwH+AAECZwBVAf4AAQJ/AAACMQAuAn8AAAIxAC4CfwAAAjEALgJ4AD0B4AA3AngAPQHgADcCeAA9AeAANwJ4AD0B4AA3AtoAYQJn",
  "ADcC2gAeAmkANwIsAGECNAA3AiwAYQI0ADcCLABhAjQANwIsAGECNAA3AiwAYQI0ADcC2AA9AmcANwLYAD0CZwA3AtgAPQJnADcC2AA9AmcANwLlAGECav/Z",
  "AuUAAAJqAAkBU//zAQL/ygFTABUBAv/sAVMADgEC/+UBUwAoAQIAGwFTACgCZAAoAgQATgER/7IBAv/JAmsAYQIWAFUCFgBVAgwAVwECAEwCDABhAQIAQQIM",
  "AGEBAgBVAgwAYQEMAFUCDAANAQL/9wL4AGECagBVAvgAYQJqAFUC+ABhAmoAVQKwAAEC+ABhAmoAVQMNAD0CXQA3Aw0APQJdADcDDQA9Al0ANwOgAD0DsgA2",
  "Am4AYQGdAFUCbgBhAZ0APgJuAGEBnQBHAiUAMwHfADMCJQAzAd8AMwIlADMB3wAzAiUAMwHfADMCLAAKAWkAEAIsAAoBaQAQAiwACgFpABAC2wBaAmoATwLb",
  "AFoCagBPAtsAWgJqAE8C2wBaAmoATwLbAFoCagBPAtsAWgJqAE8DogAMAxIACwI2AAAB/gABAjYAAAI8ACYB1gAnAjwAJgHWACcCPAAmAdYAJwFGAFUBnv/z",
  "AoAAAAIxAC4Dcf//A2AALgMNAD0CXQA3AiUAMwHfADMBogAoAaIAKAF5ACgBhwAoALcAKAEsACgA9QAoAb8AKAG3ACgCYQAAAjwAJgM1AFoCYABVAu0ATwIs",
  "AGEC5QAKAgwAYQKDAD0CJQAzAVMAKAFTAB4BEf+yA6gAAQO+AGEC5QAKAmoAYQJwAAsC2wBhAn8AAAJnAGECigBhAgwAYQKzAAYCLABhA1YAAQJMACYDAABi",
  "AwAAYgJqAGECxAABA4sAYQLlAGEDDQA9AtsAYQJdAGECeAA9AiwACgJwAAsDJAAzAkoABALlAGECugBQBA0AYQQRAGECtAAIA1oAYQKCAGECeQAeBBwAYQJ/",
  "ABYCMQAuAlcAOQJAAFUBsQBVAkUAEwI0ADcC7gABAeoAIQKDAFUCgwBVAhEAVQJCAAcC6gBVAn0AVQJdADcCcABVAmcAVQHgADcB3AAUAf4AAQLVADYCEQAS",
  "AngAVQJlAEoDggBVA4oAVQK4ABIDCgBVAlIAVQHuAB0DRABVAi8AEAI0ADcCagAJAbEAVQHvADcB3wAzAQIATgEC//UBAv/JA0oABwN2AFUCagAJAhEAVQH+",
  "AAECcgBVAhQAYQG0AFUB9AAoA+gAKAPoACgBm//+AK8ADACvAAwA+gAfAK8ADAFnAAwBZwAMAaAAHwIAAEECAAA8AXgATQMXAEgEmQAxAOgAJwGYACcBNgAo",
  "ATYAJwHzAEgAgv9BAjwAFwP8AF8AAP/AAfQAAAPoAAAB9AAAA+gAAAFNAAAA+gAAAKcAAAI8AAABDAAAAKYAAABkAAAAAAAAA+gAKQEC/8kDEAA9AmgANwMM",
  "AFoCogBPAiwAYQMAAGICNAA3AoMAVQOXABkDFQASAqMACQJ6AAkDmgBhAuYAVQKrAAACPAAEA6EAYQMMAFUC2QALAoAABgPYAGEDUQBVAksAHgHqAAwDJABa",
  "AvkATwMOAD0CXQA3AnsAAAIEAAACewAAAgQAAATEAD0ERwA3AzUAPQKTADcEAgA9A4gAOgOXABkDFQASAoMAPAHsADcCYQAzAAD9xwAA/doDEQBhApMAVQJn",
  "ABcCUgAJAmUAYQJnAFUCEgAXAbIACAKLAGECFQBVA4gAAQMcAAECTAAmAeoAIQKeAGECLQBVAmoAYQIRAFUCagANAhYACQK1AAcCbwASAvMAYQKRAFUDLwBh",
  "AuIAVQQgAGEDXwBVAwsAPQKCADcCeAA9AeAANwIsAAkB2wAUAjYAAAH8AAACNgAAAfwAAAJ3AAQCKAASA14ACQLUABQCvwBQAm0ASgK6AFACXgBKAroAYQJq",
  "AFUDUQAbApkAFgNRABsCmQAWAVMAKANWAAEC7gABArgAYQIwAFUCzwABAksABwLbAGECbQBVAvQAYQKWAFUCugBQAmUASgOVAGEC8wBVAVMAKAJ/AAACMQAu",
  "An8AAAIxAC4Dcf//A2AALgIsAGECNAA3AuMAOwI0ADMC4wA7AjQAMwNWAAEC7gABAkwAJgHqACECSAAjAfIADgMAAGICgwBVAwAAYgKDAFUDDQA9Al0ANwMO",
  "AD0CXQA3Aw4APQJdADcCeQAeAe4AHQJwAAsB/gABAnAACwH+AAECcAALAf4AAQK6AFACZQBKAhIAYQGxAFUDWgBhAwoAVQISABcBsgAIAngABAImABICSgAD",
  "AhEAEgJnAD4CZwA3A4YAPgODADYDiQAjAykAJgJ5ACMCGQAmA9oAAANbAAcD9wBhA5UAVQL4AD0CggA3AssACQKQABQCTQA1AeMAKwLIAAECSgAHAiwACgFp",
  "ABACZwAJAtoACgJnAGECZwBVAnsAWgJkAFICeAAfAngAPQH3ADcC2gAeAyoACgJnADMCZwA3AlwARgIsADwC4wA7AkwANgJN/+8C2AA9AjoAAAOmAFUBXABa",
  "AVMAIgJrAGECFgBVAQIADwIe//oEBgBaAvj/9QJqAFUDDgA9BDMAPQNNADcCrQAKAmcAVQJuAGECJQAvAd8ALQI8ACYBZf/4AWkAEAJAAAoBaQAQAiwACgMO",
  "ACUC2wBaAkAAAAIeAAECPAAmAdYAJwJIACMCSAA3AfIAIgHyABwCOgAwAkgAIwHqACEBzwAkAksAVQFQAIECKwCBAgQAQQENAEgFDABhBLAAYQQ9ADcDHQBh",
  "Aw4AYQIEAFUECQBhA/oAYQNsAFUCfwAAAjEALgFTAAEBAv/YAw0APQJdADcC2wBaAmoATwLbAFoCagBPAtsAWgJqAE8C2wBaAmoATwLbAFoCagBPAn8AAAIx",
  "AC4CfwAAAjEALgNx//8DYAAuAtgAPQJnADcC2AA9AmcANwJrAGECFv/YAw0APQJdADcDDQA9Al0ANwJIACMB8gAOBQwAYQSwAGEEPQA3AtgAPQJnADcDqgBh",
  "ApUAYQL4AGECagBVAn8AAAIxAC4CfwAAAjEALgIsAFECNAA3AiwAYQI0ADcBU//KAQL/oQFTAA4BAv/lAw0APQJdADcDDQA9Al0ANwJuAFcBnQAQAm4AYQGd",
  "AFQC2wBaAmoATwLbAFoCagBPAj8AJgHwAB4C5QBhAmr/2QLlAGEDXwA3Ap8AOgJUADICPAAmAdYAJwJ/AAACMQAuAiwAYQI0ADcDDQA9Al0ANwMNAD0CXQA3",
  "Aw0APQJdADcDDQA9Al0ANwI2AAAB/gABAX0ABwLpAFUBhAAOA8wANwPMADcCfwAAAngAPQHgADcCDAAKAiwACgHfADMB1gAnAcAAAgG0AAwCigAPAtsACgJh",
  "AAACLABhAjQANwER/7IBAv/JAv8APQJnADcCbgAKAZ0ACgI2AAAB/gABAjQAMwHjACsC1QA2Aw0APQJnADcDogAMAxIACwHWACcAAAAAAAAAAAAA/+wAAP8r",
  "AjwAKAInAIEBZwAMAAD/7AAA/ywAAP+MAAD/jAAA/4wApgAAAkgAJwH0//0BDABIAAD/jAAA/4wAAP+LAAD/iwAA/4sAAP+MA7IAAAMpAAcDJgBhAzIAVQOM",
  "ABYDcAAQAmoAYQIRAFUD8QABAzIABwRDAGEDawBVAukAYQKDAFUC2QBhAoIAVQI0ADMBAgBVAQL/yQLc/+sFewAGArUABgLJAAECcv/VBIwAEwJTABICSgAH",
  "BF4ADwJ/ADYCfwBYAUQATwFEABgBjwAUAXYAEAJhABcCXQAXAxwAJwKqAEgDPQA1AjwAHQKOADUDNgA0AQwASAFCACgBvAAUAl0AFwInACkB9AC8A1cADAKn",
  "AAwDRQAyAo8AXgDtACwD6ABPAgUANQI8ACQBDABIAicAKQIYAEgA3QA1AmEAFwFwAEQBQgAoAUIAKAG4/+YA6P/mAxQAJwJa/+YA3gAAAlgAAAJYAAACWAAA",
  "AlgAAAJYAAACWAAAAAAAAAAAAAAAAAAAAAAAAAJYAAACRgAKAXQABwYIAC0AAP9z/83+E/67/4L/Wf9X/2X/lP4V/2z9+v9k/57+Nf44/qj+qf9IAAAAAgAA",
  "AAMAAAAUAAMAAQAAABQABAJ6AAAAWgBAAAUAGgB+ATABMQFhAWMBfwGRAZIBnwGhAa4BsAHcAd0B7wHwAfkB/wIXAhsCNgI3Ak8EAAQMBA0ETwRQBFwEXwSC",
  "BJEFEwUdBScFLyALIGQgaSBvIKwgvSEW//3//wAAACAAoAExATIBYgFkAYABkgGTAaABogGvAbEB3QHeAfAB8QH6AgACGAIcAjcCOAQABAEEDQQOBFAEUQRd",
  "BGAEgwSSBRQFHgUoIAAgDCBmIGogrCC9IRb//f///+H/wAJO/78BLv+/ARL/rQERADsBDwAuAQ0BoQEM/+oBC/9GAQUAAAEBAUkBAP3f/VX90/1U/ZH9UwAA",
  "/YMAAP18AAD+VgAA4c0AAONT4v7hHuMB4LUB3AABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANAAAAAAAAAAAAAAAAAAAAAAAAAAo",
  "AAAAKgAAAEQAAABUAAAAYAAAAAAAAAAAAAAAAAAAAUYBRwEhASIB4gGwAbEDzwPQA9ED0gPTAgYCBwIIAgkCCgILAgwCDQGyAbMDbgNvA3ADcQNyA3MDUwNU",
  "A1UDVgOBA4UDggOGA4MDhwOEA4gDWANZA1oDWwOsA60DXAG0AbUBtgNdAbcBuAG5AboBuwG8Ab0BvgNeAb8BwAHBA6sDnQOoAcIDmAOzA7QDXwNgA2EDYgNj",
  "A2QBwwPAAcQBxQNlA68DrgOxA44BxgHHA6AByAOaA2YDqgOQA48DiQOZAckDjAONA54DnwOTA6UDoQOKA4sDnAOiA5EDpwO/A6MDmwOVA6QDsAOXA5QDqQOW",
  "A5IDpgNnA7IDvQO1A7gDtwO2AACwACwgsABVWEVZICBLuAAOUUuwBlNaWLA0G7AoWWBmIIpVWLACJWG5CAAIAGNjI2IbISGwAFmwAEMjRLIAAQBDYEItsAEs",
  "sCBgZi2wAiwjISMhLbADLCBkswMUFQBCQ7ATQyBgYEKxAhRDQrElA0OwAkNUeCCwDCOwAkNDYWSwBFB4sgICAkNgQrAhZRwhsAJDQ7IOFQFCHCCwAkMjQrIT",
  "ARNDYEIjsABQWGVZshYBAkNgQi2wBCywAyuwFUNYIyEjIbAWQ0MjsABQWGVZGyBkILDAULAEJlqyKAENQ0VjRbAGRVghsAMlWVJbWCEjIRuKWCCwUFBYIbBA",
  "WRsgsDhQWCGwOFlZILEBDUNFY0VhZLAoUFghsQENQ0VjRSCwMFBYIbAwWRsgsMBQWCBmIIqKYSCwClBYYBsgsCBQWCGwCmAbILA2UFghsDZgG2BZWVkbsAIl",
  "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",
  "QystsFssswAAAUMrLbBcLLMAAQFDKy2wXSyzAQABQystsF4sswEBAUMrLbBfLLIAAEUrLbBgLLIAAUUrLbBhLLIBAEUrLbBiLLIBAUUrLbBjLLIAAEgrLbBk",
  "LLIAAUgrLbBlLLIBAEgrLbBmLLIBAUgrLbBnLLMAAABEKy2waCyzAAEARCstsGksswEAAEQrLbBqLLMBAQBEKy2wayyzAAABRCstsGwsswABAUQrLbBtLLMB",
  "AAFEKy2wbiyzAQEBRCstsG8ssQA8Ky6xMAEUKy2wcCyxADwrsEArLbBxLLEAPCuwQSstsHIssAAWsQA8K7BCKy2wcyyxATwrsEArLbB0LLEBPCuwQSstsHUs",
  "sAAWsQE8K7BCKy2wdiyxAD0rLrEwARQrLbB3LLEAPSuwQCstsHgssQA9K7BBKy2weSyxAD0rsEIrLbB6LLEBPSuwQCstsHsssQE9K7BBKy2wfCyxAT0rsEIr",
  "LbB9LLEAPisusTABFCstsH4ssQA+K7BAKy2wfyyxAD4rsEErLbCALLEAPiuwQistsIEssQE+K7BAKy2wgiyxAT4rsEErLbCDLLEBPiuwQistsIQssQA/Ky6x",
  "MAEUKy2whSyxAD8rsEArLbCGLLEAPyuwQSstsIcssQA/K7BCKy2wiCyxAT8rsEArLbCJLLEBPyuwQSstsIossQE/K7BCKy2wiyyyCwADRVBYsAYbsgQCA0VY",
  "IyEbIVlZQiuwCGWwAyRQeLEFARVFWDBZLQAAAABLuADIUlixAQGOWbABuQgACABjcLEAB0JAC5ODcwBdUUEALQkAKrEAB0JAFIgIeAhoCGICVgZGCDoGMgQk",
  "BwkKKrEAB0JAFJAGgAZwBmUAXAROBkAENgIrBQkKKrEAEEJBCyJAHkAaQBjAFcARwA7ADMAJQAAJAAsqsQAZQkELAEAAQABAAEAAQABAAEAAQABAAAkACyq5",
  "AAMAAESxJAGIUViwQIhYuQADAGREsSgBiFFYuAgAiFi5AAMAAERZG7EnAYhRWLoIgAABBECIY1RYuQADAABEWVlZWVlAFIoGegZqBmQBWARIBjwENAImBQkO",
  "KrgB/4WwBI2xAgBEswVkBgBERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "AFsAWwBJAEkCygAAAhgAAP8QAtT/9gIi//b/EABcAFwASwBLAjwAAAJF//gAXABcAEsASwI8AjwAAAAAAkUCRf/4AAAAWwBbAEkASQLK//YC+AIY//b/EALV",
  "//YC/QIi//b/EABIAEgAPgA+AWgA6P+g/xABaADo/5r/EABIAEgAPgA+AR8BHwBbAFsASQBJAsoAAALsAhgAAP8QAtX/9gLsAiL/9v8QADsAOwAsACwBKv9+",
  "AWEA4v+g/xABMv92AWEA6P+a/xAAOwA7ACwALALLAaAC4AJhAR8AjwLgAZgC4AJnARkAjwAAAAAAAAAsAFQAqAEnAbwCSwJmAooCrgLmAw4DLgNJA2gDhAO9",
  "A+QEJQSDBL4FEQVxBZYGAgZjBpgGywbhBwwHIgd7CCUIXwi2CPwJKwlXCXwJzAn0ChwKTQp6CpgK0QsBCz0LeQvCDAgMXQx7DKgM1Q0iDU0NcQ2cDbsN1w32",
  "Dh0OOg5kDt0PVQ+bEBkQbRDBEUARhxHqEmkSrxLPEzATeROyFB4UgxTZFS4VdRW8FesWNxZgFqEWzBcOFy8XcRe2F7YX4RhIGJwZBxlDGXMZ/Ro1GsEbdxuZ",
  "G7sbwxxRHG8csRzlHScdiB2vHgYeTx5eHpkexx8MHy4fmyAOIOghQCFRIWIhcyGEIZUhpiHlIfEiAiITIiQiNSJGIlciaCJ5IsEi0iLjIvQjBSMWIycjRCOo",
  "I7kjyiPbI+wj/SQ5JMsk1yTjJO8k+yUHJRMlvSXJJdUl4SXtJfkmBSYRJhwmKCaIJpQmoCasJrgmxCbQJx0neyeHJ5MnnyerJ7coHygrKDwoSChZKGUocSh9",
  "KI4omiirKLcoyCjUKOUo8SkCKaApqCpBKlIqXipvKnsqjCqYKqQrLSs+K0orWytnK3grhCuVK6ErrSxlLHYshyzJLT0tTi1aLWstdy2ILZQtny2qLbstxy3T",
  "LeQt7y37LgcuPC5NLl4uai52Lq8u7S7/LxEvQS95L4ovli+iL64vvy/LL9YwJjCMMJ0wqTC6MMYw1zDjMYAx+zIMMhgyJDIvMkAyTDJdMmkyejKGMpIynjKv",
  "MrsyxzLTMuQzYjOSM+kz+jQGNBc0IzQ0NEA0UTRdNG40ejTgNOw0/TUJNRo1JjU3NUg1VDVlNXE1gjWONc82Rja6N4Y3lzejN7Q3wDfMN9g4DjhEOGU4lzjB",
  "OQM5Ojl4ObY58Do6Oog65TstOz47rju/PBI8GjwiPDM8Oz0tPXY9rD29PiE+SD5QPo8+lz63Pvs/Az89P5k/y0AgQEhAnUClQK1AtUDYQOBA6EDwQTFBokGq",
  "QdZCC0IyQmZCpULrQyNDd0PyRDdEP0SaROVFBEVFRU1FiEXnRhRGZEaMRt5HFkdAR0hHbEd0R3xHnEekR6xHtEfdSBBIO0huSK1I8UknSXpJ2koUSh9KoEqs",
  "SwBLCEsQSxxLJEvCTAdMD0wbTH9Mp0zMTQFNHE03TT9NZ02GTaVNtE3WTgtOO05KTn9OxU7nTvdPt0/OT9pP71AEUBBQLFCgURFRO1E7UTtRO1E7UTtRO1E7",
  "UTtRO1E7UTtRO1GdUahSClJZUqxTA1MUUyVTMFM8U45T3FQkVGtU91WAVb9V+1ZHVpNW6Fc7V9RYTFj5WaJZqlmyWgFaTVqkWwRbFVshW5hbpFwMXGpdH13Y",
  "Xmpe+V9BX4dfsGDCYWZhymIrYnNiu2MLY4xju2PoZFdkq2T0ZTllz2ZgZphmzWcHZ0Jnfme9Z+9oIGhVaIhouGjmaVNpq2ouatNrSWu9a+hsE2wbbElsfmy7",
  "bPNtKW1ebZNt1m4Vblxuo27ZbuFvZW/qcHpxAXEJcWZxw3Iscnpy3XNOc6Vz5nQYdEt0iXTIdQ11TnVWdbN2U3Zkdm92d3Z/ds93QneXd593sHe7d8x313fo",
  "d/N4PXiKeJt4p3i4eMN41HjfeOd473kAeQt5HHkoeTl5RHlVeWB5cXl8eY15mHnBeel5+noFeld6qHr5e0d7gXu3e/J7+nxOfLN9O32bffR+S37Hfwx/Xn+1",
  "gACARYCAgLiBGIEggbGCV4Jjgm6DBoOMg5SEG4RdhLyFA4VkhduF44ZDhoSHDYeGh7SHvIgfiGSI04klibqJ7Yopiq2LDItFi9+MQoyPjJeMn40JjVyNw45L",
  "jpaO8I9Ij1CPvpAYkF2Qz5EKkVeRs5IJkoeSwpL/kweTWJOolAuUdJTClQ6VYpW9leGV7ZY7lkOWWJZolniWhJaQlpyWqJa0lsCW0Zbclu2W+JcJlxSXJZcw",
  "l5qYRZi6mXCZ9Zq9mzWb75xnnUidq55Vnmaecp7Xn4afl5+in7OfxJ/Qn9yf8aAAoBGgHKAooDSgQKBRoF2gtqEPoSChLKE9oUmhWqFmoXehg6GUoaChsaG9",
  "oc6h2qHrofeiCKIUoiWiMaJCok6iX6JronyiiKLWoySjNaNGo5akoaT+pW2ltqW+pc+l26XnpfOmbKb+p3qn9KgFqBGodqjZqOqo9qlYqeuqS6rXq06rvaw9",
  "rLes5a06rbiuCK5Drn2u4q8rrzOvurAxsHSxE7GcsiGyb7LUsxKza7O+tBu0bLR0tHy0hLSMtNO007TTtQS1NbVRtVy1kbWytdO197Y2tnW2dbaqtrK3ObeA",
  "t8K34bgAuCe4arjmuVC5nLoXumi7NLtqu6K8Zr0CvXq+Ab4uvlu+nb7fvue+/L8tv2u/1cA9wPnBPcGfwgPCesKVwsHC7MMVw0DDYsOHw67DucR7xIfE2cUa",
  "xYXFysXYxeDGPsZkxnPGe8aHxpPHJMdxx6TH5MgdyELInsiwyLzI8ckVySTJLMk0yUDJW8lvyX/Jf8l/yX/Jf8l/yX/Jf8l/yX/Jf8l/yX/JzMomyxrLI8sr",
  "yzTLPctGy0/LWMthy2rLc8t8y8DL88v7zEfMgMylzMrNAgAAAAIASP/yAMQCygADAA8AH0AcAAAAAV8AAQFqTQACAgNhAAMDcQNOJCMREAQNGis3IwMzAzQ2",
  "MzIWFRQGIyImozkZa3QkGhklJRkaJMkCAf1sJR4eJSQgIAACAEEByAFXAsoAAwAHACRAIQIBAAABXwUDBAMBAWoATgQEAAAEBwQHBgUAAwADEQYNFysTAyMD",
  "IQMjA6AUNxQBFhQ3FALK/v4BAv7+AQIAAAIAGQAAAmwCygAbAB8AR0BEDAoCCA8QDQMHAAgHaA4GAgAFAwIBAgABZwsBCQlqTQQBAgJrAk4AAB8eHRwAGwAb",
  "GhkYFxYVFBMRERERERERERERDR8rAQczFSMHIzcjByM3IzUzNyM1MzczBzM3MwczFQUzNyMB4B+JlilHKY8nRiZ+iyCGkihIKJAoRSh//n+PH48BtKBD0dHR",
  "0UOgQtTU1NRCoKAAAAMAPv/GAgQC9wAiACkAMABpQBQwKikjGRgVFAgECgECIAMCAAECTEuwLVBYQBwEAQIDAQMCAYAABQAFhgABAAAFAQBqAAMDbANOG0Ag",
  "AAMCA4UEAQIBAoUABQAFhgABAAABWQABAQBiAAABAFJZQAkfEREWFRAGDRwrNyYmJzUWFhc1JiY1NDY3NTMVFhYXByYmJxUeAhUUBgcVIxEGBhUUFhcTNjY1",
  "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",
  "AQ4NDA5pGAEUGgEWFRQWaQAcHh4cWQAcHB5hAB4cHlFiYlRURkY4OCoqHBwODgAAYm9ib21raWhmZFRhVGFfXVtaWFZGU0ZTUU9NTEpIOEU4RUNBPz48Oio3",
  "Kjc1MzEwLiwcKRwpJyUjIiAeDhsOGxkXFRQSEAANAA0iEiIoBxkrsQYARAM2NjMyFhcjJiYjIgYHBTY2MzIWFyMmJiMiBgchNjYzMhYXIyYmIyIGBwM2NjMy",
  "FhcjJiYjIgYHITY2MzIWFyMmJiMiBgcBNjYzMhYXIyYmIyIGByE2NjMyFhcjJiYjIgYHBTY2MzIWFyMmJiMiBgeBAzs8Oj8ELwMtHiQmBAEoAjw8Oj8ELwQs",
  "HiQmBP0wAzs8Oj8ELwMtHiQmBJQCPDw6PwQvBCweJCYEA08DOz05QAMuBC0dJCcD/MADOzw6PwQvAy0eJCYEAngCPDw6PwQvBCweJCYE/oADOzw6PwQvAy0e",
  "JCYEAps1PUAyIhIRI6c1PT8zIhIRIzU9PzMiEhEj/uM0PkAyIRIQIzQ+QDIhEhAj/ts1PUAyIRMRIzU9QDIhExEjozQ+QDIhEhAjAAAI/dr+6AImAzQACAAR",
  "ABoAIwAsADUAPgBHAFGxBmREQEYaEQIAATc0LCsoJyMfHhsWFQ0MDgMAPDsxMAQCAwNMBAEBAAADAQBnAAMCAgNXAAMDAl8AAgMCTwAAR0ZDQgAIAAgTBQcX",
  "K7EGAEQTBgYHIyc2NjcFFhYXBycmJicFBgYHJzc2NjcBFhYXFQcmJiclFhYXFSYmJzUDFhYXByYmJzcFFwcGBgcnNjYFBgYHIzY2NzNBDBcGUgYMKBT+oBs/",
  "GjoJFzASAzIrYCM5ASlmL/xQMnErCS1pLwOHLWouMXEsMhcwEigbPxo5/eA5AShnLygrYAFoDCgUOQwXBlIDNDFxLAktai6BK2AjOQEpZi4xGz8aOQoXMBL+",
  "zQwXBlIGDCgUOQwoFDkMFwZS/u0oZy8pLGAiOhg6CRcwEigbP1ctaS8ycSsAAgBh/0QDAAObAA0AJQBMQEkfAQgGAUwDAQECAYUAAgoBAAYCAGkACAsBCQgJ",
  "YwcBBgYmTQUBBAQnBE4ODgEADiUOJSQjIiEaGRgXEA8LCggGBAMADQENDAcWKwEiJiczFhYzMjY3MwYGEzcjETQ2NjcjASMRMxEUBgYHMwEzETMDAX9iUAVR",
  "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",
  "EFAQGllNVEs980oA//8AYgAAAqADVwImAWwAAAEHAUoAzgCyAAixAQGwsrA1K///AFUAAAItAqUCJgGMAAAABwFKAI0AAP//AGIAAAKgA4wCJgFsAAABBwBo",
  "AGkAsgAIsQECsLKwNSv//wBVAAACLQLaAiYBjAAAAAYAaCgA//8APf/2AtADjAImADAAAAEHAGgAZQCyAAixAgKwsrA1K///ADf/9gInAtoCJgBQAAAABgBo",
  "DQD//wA9//YC0ALVAgYB9QAA//8AN//2AicCIgIGAfYAAP//AD3/9gLQA38CJgH1AAABBwBoAGUApQAIsQMCsKWwNSv//wA3//YCJwLaAiYB9gAAAAYAaAwA",
  "//8AHv/2AjsDjAImAYEAAAEHA8EA7QCyAAixAQKwsrA1K///AB3/9gG3AtoCJgGhAAAABwPBANAAAP//AAv/9gJwA1cCJgF3AAABBwFKAIkAsgAIsQEBsLKw",
  "NSv//wAB/xAB/gKlAiYAWgAAAAYBSkIA//8AC//2AnADjAImAXcAAAEHAGgAJACyAAixAQKwsrA1K///AAH/EAH+AtoCJgBaAAAABgBo3QD//wAL//YCcAOw",
  "AiYBdwAAAQcBUACiALIACLEBArCysDUr//8AAf8QAf4C/gImAFoAAAAGAVBbAP//AFAAAAJZA4wCJgF7AAABBwBoADAAsgAIsQECsLKwNSv//wBKAAACEALa",
  "AiYBmwAAAAYAaAkAAAEAYf9EAfsCygAJAChAJQABAAIBAmMAAAAEXwUBBAQmTQADAycDTgAAAAkACREREREGBxorARUhETMRIzUjEQH7/sBVVVoCylD91v70",
  "vALKAAABAFX/RwGbAhgACQAoQCUAAQACAQJjAAAABF8FAQQEKE0AAwMnA04AAAAJAAkRERERBgcaKwEVIxEzESM1IxEBm+5PV1ACGEn+ev7+uQIY//8AYQAA",
  "AvkDjAImAX8AAAEHAGgAjwCyAAixAwKwsrA1K///AFUAAAK1AtoCJgGfAAAABgBoXwAAAQAX/zoB+wLKABwAUkBPBAEBAgMBAAECTAAJAwIDCQKABwEECAED",
  "CQQDZwABCgEAAQBmAAYGBV8ABQUmTQACAicCTgEAGRgXFhUUExIREA8ODQwLCggGABwBHAsHFisXIiYnNRYWMzI1NSMRIzUzESEVIRUzFSMVMxUUBpQTHwoI",
  "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",
  "BhURNjY1NCYBhT9iOCpfonhaRw8FHl88RlEjqKFMAtU0bFNDhYBzMeYDu2EtPk45Z0X+qEfSflNTAP//AGEAAAKXA7ACJgAvAAABBwPDAucAsgAIsQEBsLKw",
  "NSv//wBVAAACGQL+AiYATwAAAAcDwwKgAAD//wAAAAACfgOwAiYAIgAAAQcDzAJkALIACLECArCysDUr//8ALv/2AeAC/gImAEIAAAAHA8wCPwAA//8AAAAA",
  "An4DlgImACIAAAEHA80BPgCyAAixAgGwsrA1K///AC7/9gHgAuQCJgBCAAAABwPNARkAAP//AFEAAAHwA7ACJgAmAAABBwPMAlcAsgAIsQECsLKwNSv//wA3",
  "//YCAQL+AiYARgAAAAcDzAJDAAD//wBhAAAB8AOWAiYAJgAAAQcDzQExALIACLEBAbCysDUr//8AN//2AgEC5AImAEYAAAAHA80BHQAA////ygAAATEDsAIm",
  "ACoAAAEHA8wB0ACyAAixAQKwsrA1K////6EAAAEIAv4CJgN/AAAABwPMAacAAP//AA4AAAFFA5YCJgAqAAABBwPNAKoAsgAIsQEBsLKwNSv////lAAABHALk",
  "AiYDfwAAAAcDzQCBAAD//wA9//YC0AOwAiYAMAAAAQcDzAKtALIACLECArCysDUr//8AN//2AicC/gImAFAAAAAHA8wCVQAA//8APf/2AtADlgImADAAAAEH",
  "A80BhwCyAAixAgGwsrA1K///ADf/9gInAuQCJgBQAAAABwPNAS8AAP//AFcAAAJfA7ACJgAzAAABBwPMAl0AsgAIsQICsLKwNSv//wAQAAABjgL+AiYAUwAA",
  "AAcDzAIWAAD//wBhAAACXwOWAiYAMwAAAQcDzQE3ALIACLECAbCysDUr//8AVAAAAY4C5AImAFMAAAAHA80A8AAA//8AWv/2AoADsAImADYAAAEHA8wClACy",
  "AAixAQKwsrA1K///AE//9gIVAv4CJgBWAAAABwPMAlsAAP//AFr/9gKAA5YCJgA2AAABBwPNAW4AsgAIsQEBsLKwNSv//wBP//YCFQLkAiYAVgAAAAcDzQE1",
  "AAAAAQAm/0wCCQLUACkAIEAdKSEXFgwLCAAIAEkAAAABYQABAXAAThsZFBICDRYrFz4DNTQmJwYGByc+AjU0JiMiBgcnNjYzMhYWFRQGBx4CFRQGBgcncZZX",
  "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",
  "EQsNHSsTNTMRMxEhETMRMxUjFRQGBiMiJjU1FxQWMzI2NTUhClBaAXNZUVE8e1+Fi1pdXmFX/o0BYk4BGv7mARr+5k5mSndFkXdkZ1dgZ1FmAP//AAAAAAJg",
  "As0CBgFRAAAAAwBh/7UB8AL4ABMAFwAbALVLsBJQWEAuAAEAAAFxCgEHDQEICQcIZwAEBGxNCwEGBgNfBQEDA2pNDAEJCQBfAgEAAGsAThtLsClQWEAtAAEA",
  "AYYKAQcNAQgJBwhnAAQEbE0LAQYGA18FAQMDak0MAQkJAF8CAQAAawBOG0AtAAQDBIUAAQABhgoBBw0BCAkHCGcLAQYGA18FAQMDak0MAQkJAF8CAQAAawBO",
  "WVlAFhsaGRgXFhUUExIRERERERERERAODR8rISMHIzcjESE3MwczFSMHMxUjBzMBMzcjETM3IwHw5hNBE2gBHQxBDDFFOGt/QdL+y3c4ryJBY0tLAsouLk/f",
  "Tv8BTd/91P8ABAA3/94CDAI2AB4AJQApAC0AXkBbDQsCBAAoJA4DBQQsGBMCBAIBHhkBAwMCBEwMAQBKCQYCBQoHAgECBQFnCAEEBABhAAAAc00AAgIDYQAD",
  "A3EDTioqJiYgHyotKi0mKSYpIyIfJSAlJSIXKAsNGisXJzcmJjU0NjYzMhc3FwcWFRUjBxYzMjY3FQYGIyInEyIGBzM3Jhc0JwcHFhc3cjo2Gh07a0dNNis6",
  "NCm+cSlCM08qKVA3WT6BP0kHi1ogTAYp5AESRiIoSSJdOlh+RCc7KEY+WjWaIBMSTRIRKQG7UUh7HpkfGThGOChgAAH/sv9CAQcCygAYADpANwQBAQIDAQAB",
  "AkwFAQMGAQIBAwJnAAEHAQABAGUABARqBE4BABUUExIREA8ODQwIBgAYARgIDRYrByImJzUWFjMyNjY1ESM1MxEzETMVIxEUBgQYJA4QJBQZLRxSUlpRUWa+",
  "BwZMBAYUMi0BNk4BQv6+Tv7RZ2IAAv/J/xAA+ALhAAsAIwDVQAoQAQMEDwECAwJMS7AKUFhAJQcBBQgBBAMFBGcAAQEAYQAAAGxNAAYGbU0AAwMCYQkBAgJv",
  "Ak4bS7AMUFhAJQcBBQgBBAMFBGcAAQEAYQAAAHBNAAYGbU0AAwMCYQkBAgJvAk4bS7AtUFhAJQcBBQgBBAMFBGcAAQEAYQAAAGxNAAYGbU0AAwMCYQkBAgJv",
  "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",
  "DAAANzUwOzE7KykkLyUvHx0YIxkjExEMFw0XAAsACxEREREREw0bKwURITUhETMRIRUhEQEiJjU0NjMyFhUUBiEiJjU0NjMyFhUUBgEiJjU0NjMyFhUUBiEi",
  "JjU0NjMyFhUUBgFo/r8BQUwBQv6+/voaICAaGh8fAaYaICAaGh8f/iYaICAaGh8fAZ0aICAaGh8fFQFUTAFT/q1M/qwCIh4gIR0dISAeHiAhHR0hIB7+NB8f",
  "IR0dIR8fHx8hHR0hHx///wBI//ICkALUACYAAgAAAAcAIAD4AAAABQA1//ADCALYAAcADwAXAB8AJwAyQC8ABAAFBgQFaQMBAQEAYQIBAABwTQgBBgYHYQkB",
  "BwdxB04nJSIiIiIiIiIiIQoNHysTNDMyFRQjIiU0MzIVFCMiBTQzMhUUIyIBNDMyFRQjIiU0MzIVFCMiNTk6OjkCYDk6Ojn+yTk6Ojn+1zk6OjkCVzk6OjkC",
  "nDw8Ozs8PDv2PDw8/v08PDw8PDw8AAABAB3//AIaAfkAFwA1QDIVFBMQDw4GAwQJCAcEAwIGAQACTAUBAwIBAAEDAGcABAQBXwABAWsBThQUERQUEAYNHCsl",
  "IxcHJxUnNQcnNyM1Myc3FzUzFTcXBzMCGrJ+LX4/fix+s7N+LH4/fyx+stt+LH6zAbJ/LX4/fyx/s7N/LH8ABAA1//UCWQLtAAsAFwAjAC8ASUBGBQEDCgQJ",
  "AwIHAwJpCAEAAAFhAAEBbE0ABwcGYQsBBgZxBk4lJBkYDQwBACspJC8lLx8dGCMZIxMRDBcNFwcFAAsBCwwNFisBIiY1NDYzMhYVFAYDIiY1NDYzMhYVFAYh",
  "IiY1NDYzMhYVFAYDIiY1NDYzMhYVFAYBQxogIBoaHx/uGiAgGhofHwGXGiAgGhofH/caICAaGh8fAnEeICAeHiAgHv7AHiAhHR0hIB4eICEdHSEgHv7EHiAh",
  "HR0hIB4AAAQANP/wAwEC2AAHAA8AFwAfAC1AKgQBAgUBAwYCA2kAAQEAYQAAAHBNAAYGB2EABwdxB04iIiIiIiIiIQgNHisBNDMyFRQjIgU0MzIVFCMiJTQz",
  "MhUUIyIFNDMyFRQjIgFcOTo6Of7YOTo6OQJaOTo6Of7OOTo6OQKcPDw7/zw8Ozs8PDv7PDw8//8ASACzAMQBOgMHAA8AAADBAAixAAGwwbA1K///ACgA5QEa",
  "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",
  "CAYEAwARAREGBxYrsQYARAMyFhYzMxUjIiYmIyIVIzU0NkYmSVIzBgg4WEQcNEA9A3IdHT4cGzkPNTYAAAAAGgE+AAMAAQQJAAAAaAAAAAMAAQQJAAEAFABo",
  "AAMAAQQJAAIADgB8AAMAAQQJAAMAIgCKAAMAAQQJAAQAJACsAAMAAQQJAAUArADQAAMAAQQJAAYAIgCKAAMAAQQJAQQADgB8AAMAAQQJAQUADAF8AAMAAQQJ",
  "AQYACAGIAAMAAQQJAQcAFAGQAAMAAQQJAQgACgGkAAMAAQQJAQkADgB8AAMAAQQJAQoADAGuAAMAAQQJAQsAEAG6AAMAAQQJAQwACAHKAAMAAQQJAQ0AEgHS",
  "AAMAAQQJAQ4ACgHkAAMAAQQJAQ8ACgHuAAMAAQQJARAAEgH4AAMAAQQJAREAEgH4AAMAAQQJARIAGgIKAAMAAQQJARMADAIkAAMAAQQJARQAKAIwAAMAAQQJ",
  "ARUACAJYAAMAAQQJARYADgJgAEMAbwBwAHkAcgBpAGcAaAB0ACAAMgAwADEANQAtADIAMAAyADEAIABHAG8AbwBnAGwAZQAgAEwATABDAC4AIABBAGwAbAAg",
  "AFIAaQBnAGgAdABzACAAUgBlAHMAZQByAHYAZQBkAC4AUgBlAG0AbwBrACAAUwBhAG4AcwBSAGUAZwB1AGwAYQByAFIAZQBtAG8AawBTAGEAbgBzAC0AUgBl",
  "AGcAdQBsAGEAcgBSAGUAbQBvAGsAIABTAGEAbgBzACAAUgBlAGcAdQBsAGEAcgBWAGUAcgBzAGkAbwBuACAAMgAuADAAMAA4ADsAIAB0AHQAZgBhAHUAdABv",
  "AGgAaQBuAHQAIAAoAHYAMQAuADgAKQAgAC0AbAAgADgAIAAtAHIAIAA1ADAAIAAtAEcAIAAyADAAMAAgAC0AeAAgADEANAAgAC0ARAAgAGwAYQB0AG4AIAAt",
  "AGYAIABuAG8AbgBlACAALQBhACAAcQBzAHEAIAAtAFgAIAAiACIAVwBlAGkAZwBoAHQAVABoAGkAbgBFAHgAdAByAGEATABpAGcAaAB0AEwAaQBnAGgAdABN",
  "AGUAZABpAHUAbQBTAGUAbQBpAEIAbwBsAGQAQgBvAGwAZABFAHgAdAByAGEAQgBvAGwAZABCAGwAYQBjAGsAVwBpAGQAdABoAEMAbwBuAGQAZQBuAHMAZQBk",
  "AFMAZQBtAGkAQwBvAG4AZABlAG4AcwBlAGQATgBvAHIAbQBhAGwAQwBvAG4AdAByAGEAcwB0ACAAKABHAHIAbwB0AGUAcwBxAHUAZQApAFQAZQB4AHQARABp",
  "AHMAcABsAGEAeQADAAAAAAAA/5wAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAf//AA8AAQACAA4AAAAAAAAAZgACAA4AIgA7AAEAQgBbAAEAagBqAAEAegB6",
  "AAEAgACWAAEAmAC2AAEAuAFHAAEBVgGzAAEB2gH8AAEB/wIEAAECCANPAAEDUwNWAAEDbgOIAAEDzwPTAAMAAQABAAAACAACAAEDzwPTAAAAAQAAAAoAHAAe",
  "AAFERkxUAAgABAAAAAD//wAAAAAAAAABAAAACgAyADQABERGTFQAGmN5cmwAJGdyZWsAJGxhdG4AJAAEAAAAAP//AAAAAAAAAAAAAAAAAAEAAQAIAAMAAAAU",
  "AA8AAAAsAQR3Z2h0AQUAAHdkdGgBDwABQ1RHUgEUAAIAHgAqADYAQgBOAFoAZgByAH4AigCWAKIArgC6AMYAAQAAAAABBgBkAAAAAQAAAAABBwDIAAAAAQAA",
  "AAABCAEsAAAAAQAAAAIBCQGQAAAAAQAAAAABCgH0AAAAAQAAAAABCwJYAAAAAQAAAAABDAK8AAAAAQAAAAABDQMgAAAAAQAAAAABDgOEAAAAAQABAAABEAA+",
  "gAAAAQABAAABEQBLAAAAAQABAAABEgBXgAAAAQABAAIBEwBkAAAAAQACAAIBFQAAAAAAAQACAAABFgBkAAAAAA=="
].join(""), "bold": [
  "AAEAAAASAQAABAAgR0RFRhuJGVwAAciUAAAAeEdQT1NEdkx1AAHJDAAAACBHU1VCkxWCFgABySwAAAA2T1MvMmzq4FgAAAGoAAAAYFNUQVRI7zu8AAHJZAAA",
  "AP5jbWFwbMLtMQAAETQAAAKOY3Z0IEG/Ht0AACLkAAABLGZwZ22eNhnaAAATxAAADhVnYXNwAAAAEAAByIwAAAAIZ2x5ZiuqDBkAACu8AAGZEGhlYWQnjYgT",
  "AAABLAAAADZoaGVhCFEG4gAAAWQAAAAkaG10eC5bhbIAAAIIAAAPLGxvY2EEc5w2AAAkEAAAB6ptYXhwBpUP2QAAAYgAAAAgbmFtZW2FoLMAAcTMAAADoHBv",
  "c3T/nwAyAAHIbAAAACBwcmVwRH7GuQAAIdwAAAEFAAEAAAACAgxiGwvnXw889QAHA+gAAAAA3YDT5wAAAADmzm4o/cP+6AZeBC0AAQAGAAIAAAAAAAAAAQAA",
  "BC3+2wAABn39w/3HBl4AAQAAAAAAAAAAAAAAAAAAA8IAAQAAA9QAcAAJAFQABQACAJgA/ACNAAABiQ4VAAQAAgAEAm8CvAAFAAACigJYAAAASwKKAlgAAAFe",
  "ADIBSAAAAgsIAgQFBAICBIAAAg8AAAAKAAAAIAAAAABHT09HACAAIP/9BC3+2wAABC0BJQAAAJcAAAAAAiICygAAACAABAJYAF4BBAAAAR4AOQHYAEEChgAW",
  "AjwAKwOFAB8C7gAoAQoAQQFTACgBUwAeAiEAHwI8ACsBHQAfAUIAHgEdADkBnQAHAjwAJAI8ADsCPAAmAjwAJgI8ABECPAAxAjwAIwI8ABsCPAAjAjwAIAEd",
  "ADkBHQAfAjwAKwI8ACsCPAArAd0AAwOBADICsgAAAqAAWgJ9ADoC5ABaAjAAWgIlAFoC1AA6Av0AWgGFACABS/+2ApgAWgI1AFoDrwBaAy0AWgMcADoCdABa",
  "AxwAOgKUAFoCJwAuAkMAFAL0AFUCigAAA8cAAAKbAAACcAAAAkMAGAFLAEYBnQAGAUsAGQI8ABcBm//+AWoAKAJcACoCeQBOAgIALQJ5AC0CTwAtAYMAFAJ5",
  "AC0CkQBOATEASAEx/8ACbABOATEATgPWAE4CkQBOAmsALQJ5AE4CeQAtAcYATgHxAC0BsgAXApEASwI5AAADWAAKAkIABQI5AAAB6AAbAYoADwInAN4BigAo",
  "AjwAKwEEAAABHgA5AjwARgI8ACgCPAA3AjwAAwInAN4B5gA0Al8AiANAADEBfwAXAmcAKAI8ACsBQgAeA0AAMQH0//0BrAAnAjwAKwF7ABcBewAdAWoAKAKU",
  "AE4CjwA3AR0AOQDN/+4BewAtAYQAHAJnACgDPgAWA2oAFgNNACwB3QAbArIAAAKyAAACsgAAArIAAAKyAAACsgAAA7gAAAJ9ADoCMABaAjAAWgIwAFkCMABa",
  "AYUADgGFACABhf/vAYUAGwLkABcDLQBaAxwAOgMcADoDHAA6AxwAOgMcADoCPAA/AxwAOgL0AFUC9ABVAvQAVQL0AFUCcAAAAnQAWgLHAE4CXAAqAlwAKgJc",
  "ACoCXAAqAlwAKgJcACoDlQAqAgIALQJPAC0CTwAtAk8ALQJPAC0BMf/kATEATgEx/8UBMf/xAmsALQKRAE4CawAtAmsALQJrAC0CawAtAmsALQI8ACsCawAt",
  "ApEASwKRAEsCkQBLApEASwI5AAACeQBOAjkAAAKyAAACXAAqArIAAAJcACoCsgAAAlwAKgJ9ADoCAgAtAn0AOgICAC0CfQA6AgIALQJ9ADoCAgAtAuQAWgJ5",
  "AC0C5AAXAokALQIwAFoCTwAtAjAAWgJPAC0CMABaAk8ALQIwAFoCTwAtAjAAWQJPAC0C1AA6AnkALQLUADoCeQAtAtQAOgJ5AC0C1AA6AnkALQL9AFoCkf/H",
  "Av0AAAKRAAIBhf/5ATH/zwGFAB0BMf/zAYUAAwEx/9kBhQAgATEALQGFACAC0AAgAmIASAFL/7YBMf/AApgAWgJsAE4CbABOAjUAWgExAE4CNQBaATEARQI1",
  "AFoBMQBOAjUAWgFqAE4CNQABATH/9AMtAFoCkQBOAy0AWgKRAE4DLQBaApEATgMCAAIDLQBaApEATgMcADoCawAtAxwAOgJrAC0DHAA6AmsALQPNADoD0gAt",
  "ApQAWgHGAE4ClABaAcYASAKUAFoBxgAqAicALgHxAC0CJwAuAfEAJQInAC4B8QAtAicALgHxACUCQwAUAbIAFwJDABQBsgAXAkMAFAGyABcC9ABVApEASwL0",
  "AFUCkQBLAvQAVQKRAEsC9ABVApEASwL0AFUCkQBLAvQAVQKRAEsDxwAAA1gACgJwAAACOQAAAnAAAAJDABgB6AAbAkMAGAHoABsCQwAYAegAGwF/AE4CBQAG",
  "ArIAAAJcACoDuAAAA5UAKgMcADoCawAtAicALgHxAC0B+AAoAfgAKAGbACgB0AAoAPIAKAFFACgBFgAoAeUAKAIEACgCngAAAkMAGANwAFUChwBOAz0ASwIw",
  "AFoDJQAUAjEAWgKlADoCJwAuAYUAIAGFABsBS/+2A+cACAPqAFoDJQAUAqAAWgKXAAoC6QBaArIAAAJ+AFoCoABaAjEAWgL8AAUCMABaA68AAAKIAC4DNwBa",
  "AzcAWgKgAFoC6QAIA68AWgL9AFoDHAA6AukAWgJ0AFoCfQA6AkMAFAKXAAoDXAAtApsAAAMNAFoC2AA1BDYAWgRaAFoC1wAAA4oAWgJ+AFoClwAjBC4AWgKZ",
  "//sCXAAqAm4ALQJ1AE4B3gBOApgADgJPAC0DaQAAAisAJgLQAE4C0ABOAmsATgKFAAADTABOApYATgJrAC0CjABOAnkATgICAC0CKQAXAjkAAAMuAC0CQgAF",
  "ArAATgKQADwDyQBOA9kATgLGAAADUgBOAmYATgIAACQDbQBOAlEAAAJPAC0CkQACAd4ATgIMAC0B8QAtATEASAEx//EBMf/AA3gAAAN4AE4CkQACAmsATgI5",
  "AAACoABOAkUAWgIAAE4B9AAoA+gAKAPoACgBm//+ANkADADZAAwBHQAfANkADAG9AAwBvQAMAgEAHwIEADwCBAA3AXgAMANXADkFAQAfAS8ALgIMAC4BcAAo",
  "AXAAKAI6ADkAgv9AAjwAIAQEAEIAAP+sAfQAAAPoAAAB9AAAA+gAAAFNAAAA+gAAAKcAAAI8AAABHQAAAKYAAABkAAAAAAAAA+gAKQEx/8ADOQA6AqcALQN1",
  "AFUC+ABLAjAAWgM3AFoCTwAtAtAATgO5ABUDdQATAqEAAAKWAAADtgBaAyAATgLaAAACgAAAA+0AWgOGAE4DJAAUAm8ACgQxAFoDcABOAngAFAIrAA8DbABV",
  "A0UASwMcADoCawAtAs0AAAJdAAACzQAAAl0AAAUnADoEkAAtA0QAOgKnAC0EQAA6A74AOgO5ABUDdQATAqUAOgIMAC0CYQAzAAD9xwAA/doDlABaAyIATgJ+",
  "ABcCZgACAnQAWgJ5AE4CLwAXAesAAgLeAFoCWgBOBAUAAAOuAAACiAAuAisAJgL0AFoCmQBOAqAAWgJrAE4CoAAWAmwAAgLdAAACtwAAA0kAWgLnAE4DQgBa",
  "AvYATgRlAFoDeQBOAwkAOgKQAC0CfQA6AgIALQJDABQCJgAXAnAAAAI+AAACcAAAAj4AAALnAAACgAAFA6IAFAMXABcDJAA1AtYAPALYADUCkAA8AtgAWgKR",
  "AE4DtAAAAssAAAO0AAACywAAAYUAIAOvAAADaQAAAvgAWgKNAE4DRgAIAtcAAAL9AFoClgBOA1oAWgLoAE4C2AA1ApAAPAQMAFoDngBOAYUAIAKyAAACXAAq",
  "ArIAAAJcACoDuAAAA5UAKgIwAEQCTwAtAzEAUAJPACsDMQBQAk8AKwOvAAADaQAAAogALgIrACYCTwAcAkUAHAM3AFoC0ABOAzcAWgLQAE4DHAA6AmsALQMc",
  "ADoCawAtAxwAOgJrAC0ClwAjAgAAJAKXAAoCOQAAApcACgI5AAAClwAKAjkAAALYADUCkAA8AjEAWgHeAE4DigBaA1IATgIvABcB6wACAtwAAAKFAAUCmwAA",
  "AkIABQJ+AC0CeQAtA54ALQObAC0DkQAMA2YAHAK9AAwClQAmBAkACAOnAAAEEwBaA7gATgMgADoClwAtAvYAFALeABcCiAArAisAJgMyAAgC1AAAAkMAFAGy",
  "ABcCeQACAxoABgJ+AFoCeQBOApUAVQJ6AEsCfQAjAn0AOgICAC0C5AAXA14ABQJ+AC0CeQAtAmsANwIwADsDMQBQAogAKwKn/+8C1AA6AooAAAPbAE4BkwBV",
  "AYUAGwKYAFoCbABOAUoACgJnAAQECwBVAy3/7gKRAE4DHAA6BGsAOgOhAC0C7gAFAnkATgKUAFoCJwAqAfEAJgJDABgBov/4AbIAFwJqAAUBsgAXAkMAFAMS",
  "ABsC9ABVAnoAAAJnAAoCQwAYAegAGwJPABwCTwAnAkUAJwJFADACOgAbAkIAGAIrACYB8QAkAnkATgEjAFwCJwBcAgQAMgEeADkFHQBaBMwAWgRhAC0DgABa",
  "A2YAWgJiAE4EeABaBF4AWgPCAE4CsgAAAlwAKgGF//EBMf/HAxwAOgJrAC0C9ABVApEASwL0AFUCkQBLAvQAVQKRAEsC9ABVApEASwL0AFUCkQBLArIAAAJc",
  "ACoCsgAAAlwAKgO4AAADlQAqAtQAOgJ5AC0C1AA6AnkALQKYAFoCbP/NAxwAOgJrAC0DHAA6AmsALQJPABwCRQAcBR0AWgTMAFoEYQAtAtQAOgJ5AC0EGABa",
  "AqQAWgMtAFoCkQBOArIAAAJcACICsgAAAlwAKgIwACECTwAcAjAAWgJPAC0Bhf+3ATH/jQGFAAMBMf/ZAxwAOgJrACoDHAA6AmsALQKUAEYBxv/yApQAWgHG",
  "AD4C9ABVApEAPQL0AFUCkQBLAnUAJgH6ABQC/QBaApH/xwL5AFoDYwAtAv4ANQJ1AC0CQwAYAegAGwKyAAACXAAqAjAAWgJPAC0DHAA6AmsALQMcADoCawAt",
  "AxwAOgJrAC0DHAA6AmsALQJwAAACOQAAAbMAJgMCAE4BwwAXA8EALQPBAC0CsgAAAn0AOgICAC0CNQAXAkMAFAHxAC0B6AAbAd8AAwHpAAMCoAAKAvQAAAKe",
  "AAACMABaAk8ALQFL/7YBMf/AAwcAOgJ5AC0ClAAKAcYAAAJwAAACOQAAAk8AKwIrACYDLgAtAxwAOgJ5AC0DxwAAA1gACgHoABsAAAAAAAAAAAAA/+wAAP8r",
  "AjwAKAInAFwBvQAMAAD/7AAA/ywAAP+MAAD/jAAA/4wApgAAAukALgH0//0BHQA5AAD/jAAA/4wAAP+LAAD/iwAA/4sAAP+MA/kACANxAAADYwBaA10ATgN5",
  "//sDiQAAAqAAWgJrAE4EWwAIA2wAAASBAFoDkgBOAzUAWgLSAE4DSQBaAtoATgJPACsBMQBOATH/wALw/+gF2wAFAvwABQMbAAgCif/dBSIADgKeAA4CsgAA",
  "BF8ABQKPADUCjwBXAUsARgFLABkBkAAUAagAFgJhABQCWAAUA1UAJQL7ADkDaQA5AjAAHgK1ADkDaQA5AR0AOQFCAB4B3QADAlgAFAIhAB8B9AClA7cAAwL7",
  "AAMDUgAyAo8ASQEdADkD6AAoAkMAOQJMACsBHQA5AiEAHwI6ADkBHQA5AmEAFAF4ADcBQgAeAUIAHgKDADMBpgAzA/8ALgNgADMA3gAAAlgAAAJYAAACWAAA",
  "AlgAAAJYAAACWAAAAAAAAAAAAAAAAAAAAAAAAAJYAAACWAAKAaQAAAZ9AB8AAP9Z/6/97v63/2n/Lf8u/0P/if38/1v9w/9A/5H+K/42/qD+n/8/AAAAAgAA",
  "AAMAAAAUAAMAAQAAABQABAJ6AAAAWgBAAAUAGgB+ATABMQFhAWMBfwGRAZIBnwGhAa4BsAHcAd0B7wHwAfkB/wIXAhsCNgI3Ak8EAAQMBA0ETwRQBFwEXwSC",
  "BJEFEwUdBScFLyALIGQgaSBvIKwgvSEW//3//wAAACAAoAExATIBYgFkAYABkgGTAaABogGvAbEB3QHeAfAB8QH6AgACGAIcAjcCOAQABAEEDQQOBFAEUQRd",
  "BGAEgwSSBRQFHgUoIAAgDCBmIGogrCC9IRb//f///+H/wAJO/78BLv+/ARL/rQERADsBDwAuAQ0BoQEM/+oBC/9GAQUAAAEBAUkBAP3f/VX90/1U/ZH9UwAA",
  "/YMAAP18AAD+VgAA4c0AAONT4v7hHuMB4LUB3AABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANAAAAAAAAAAAAAAAAAAAAAAAAAAo",
  "AAAAKgAAAEQAAABUAAAAYAAAAAAAAAAAAAAAAAAAAUYBRwEhASIB4gGwAbEDzwPQA9ED0gPTAgYCBwIIAgkCCgILAgwCDQGyAbMDbgNvA3ADcQNyA3MDUwNU",
  "A1UDVgOBA4UDggOGA4MDhwOEA4gDWANZA1oDWwOsA60DXAG0AbUBtgNdAbcBuAG5AboBuwG8Ab0BvgNeAb8BwAHBA6sDnQOoAcIDmAOzA7QDXwNgA2EDYgNj",
  "A2QBwwPAAcQBxQNlA68DrgOxA44BxgHHA6AByAOaA2YDqgOQA48DiQOZAckDjAONA54DnwOTA6UDoQOKA4sDnAOiA5EDpwO/A6MDmwOVA6QDsAOXA5QDqQOW",
  "A5IDpgNnA7IDvQO1A7gDtwO2AACwACwgsABVWEVZICBLuAAOUUuwBlNaWLA0G7AoWWBmIIpVWLACJWG5CAAIAGNjI2IbISGwAFmwAEMjRLIAAQBDYEItsAEs",
  "sCBgZi2wAiwjISMhLbADLCBkswMUFQBCQ7ATQyBgYEKxAhRDQrElA0OwAkNUeCCwDCOwAkNDYWSwBFB4sgICAkNgQrAhZRwhsAJDQ7IOFQFCHCCwAkMjQrIT",
  "ARNDYEIjsABQWGVZshYBAkNgQi2wBCywAyuwFUNYIyEjIbAWQ0MjsABQWGVZGyBkILDAULAEJlqyKAENQ0VjRbAGRVghsAMlWVJbWCEjIRuKWCCwUFBYIbBA",
  "WRsgsDhQWCGwOFlZILEBDUNFY0VhZLAoUFghsQENQ0VjRSCwMFBYIbAwWRsgsMBQWCBmIIqKYSCwClBYYBsgsCBQWCGwCmAbILA2UFghsDZgG2BZWVkbsAIl",
  "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",
  "QystsFssswAAAUMrLbBcLLMAAQFDKy2wXSyzAQABQystsF4sswEBAUMrLbBfLLIAAEUrLbBgLLIAAUUrLbBhLLIBAEUrLbBiLLIBAUUrLbBjLLIAAEgrLbBk",
  "LLIAAUgrLbBlLLIBAEgrLbBmLLIBAUgrLbBnLLMAAABEKy2waCyzAAEARCstsGksswEAAEQrLbBqLLMBAQBEKy2wayyzAAABRCstsGwsswABAUQrLbBtLLMB",
  "AAFEKy2wbiyzAQEBRCstsG8ssQA8Ky6xMAEUKy2wcCyxADwrsEArLbBxLLEAPCuwQSstsHIssAAWsQA8K7BCKy2wcyyxATwrsEArLbB0LLEBPCuwQSstsHUs",
  "sAAWsQE8K7BCKy2wdiyxAD0rLrEwARQrLbB3LLEAPSuwQCstsHgssQA9K7BBKy2weSyxAD0rsEIrLbB6LLEBPSuwQCstsHsssQE9K7BBKy2wfCyxAT0rsEIr",
  "LbB9LLEAPisusTABFCstsH4ssQA+K7BAKy2wfyyxAD4rsEErLbCALLEAPiuwQistsIEssQE+K7BAKy2wgiyxAT4rsEErLbCDLLEBPiuwQistsIQssQA/Ky6x",
  "MAEUKy2whSyxAD8rsEArLbCGLLEAPyuwQSstsIcssQA/K7BCKy2wiCyxAT8rsEArLbCJLLEBPyuwQSstsIossQE/K7BCKy2wiyyyCwADRVBYsAYbsgQCA0VY",
  "IyEbIVlZQiuwCGWwAyRQeLEFARVFWDBZLQAAAABLuADIUlixAQGOWbABuQgACABjcLEAB0JAC5ODcwBdUUEALQkAKrEAB0JAFIgIeAhoCGICVgZGCDoGMgQk",
  "BwkKKrEAB0JAFJAGgAZwBmUAXAROBkAENgIrBQkKKrEAEEJBCyJAHkAaQBjAFcARwA7ADMAJQAAJAAsqsQAZQkELAEAAQABAAEAAQABAAEAAQABAAAkACyq5",
  "AAMAAESxJAGIUViwQIhYuQADAGREsSgBiFFYuAgAiFi5AAMAAERZG7EnAYhRWLoIgAABBECIY1RYuQADAABEWVlZWVlAFIoGegZqBmQBWARIBjwENAImBQkO",
  "KrgB/4WwBI2xAgBEswVkBgBERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "AJgAmAB4AHgCygAAAiIAAP8QAtT/9gIs//b/EACVAJUAcwBzAkYAAAJQ//gAlQCVAHMAcwJGAkYAAAAAAlACUP/4AAAAmACYAHgAeALK//YC+AIi//b/EALV",
  "//YC/QIs//b/EAB7AHsAZQBlAWgA7v+g/xABaADu/5r/EAB7AHsAZQBlAR8BHwCYAJgAeAB4AsoAAAL4AiIAAP8QAtX/9gL4Aiz/9v8QAGMAYwBIAEgBKv9+",
  "AWgA6P+g/xABNP90AWgA7v+a/xAAYwBjAEgASALLAaAC5wJnAR8AjwLnAZYC5wJtARkAjwAAAAAAAAAsAFQAqAEPAbsCTgJpAo0CsQLhAwkDKQNEA2MDfwO4",
  "A98EJASDBLwFDgWEBakGFQZ2BqsG3QbzBx4HNAeLCDcIcQjHCQ8JPglpCY0J3QoFCi0KYAqMCqoK5QsVC1ELiwvRDBcMagyIDLUM5A04DWMNhw2yDdEN7Q4M",
  "DjIOTw56DvMPXQ+hEBYQaBCsETYRbhGhEeoSHRIyEpkS6xMkE5cUBRRYFKsU8hU7FWYVuBXhFiIWSxaPFrAW9Bc5FzkXZBfhGDcYmBjUGQQZfBm0Gj4ayRrr",
  "Gw0bFRuhG78cBxw7HHoc2R0CHVYdiR2YHdUeBB5GHmge1R9HIB4gdCCFIJYgpyC4IMkg2iE1IUEhUiFjIXQhhSGWIachuCHJIhAiISIyIkMiVCJlInYikyL3",
  "IwgjGSMqIzsjTCOIJAgkFCQgJCwkOCREJFAk+yUHJRMlHyUrJTclQyVPJVslZyXHJdMl3yXrJfcmAyYPJlwmuSbFJtEm3SbpJvUnRidSJ2MnbyeAJ4wnmCek",
  "J7UnwSfSJ94n7yf7KAwoGCgpKLoowilMKV0paSl6KYYplymjKa8qHSouKjoqSypXKmgqdCqFKpEqnStGK1craCuqLAssHCwoLDksRSxWLGIsbSx4LIkslSyh",
  "LLIsvizKLNYtCy0cLS0tOS1FLXwtqS27Lc0t/C4nLjguRC5QLlwubS55LoQu0i8+L08vWy9sL3gviS+VMHIxNzFIMVQxYDFsMX0xiTGaMaYxtzHDMc8x2zHs",
  "MfgyBDIQMiEygzKzMwUzFjMiMzMzPzNQM1wzbTN5M4ozljPqM/Y0BzQTNCQ0MDRBNFI0XjRvNHs0jDSYNMw1MDWiNmw2fTaJNpo2pjayNr429DcqN0s3fzep",
  "N+s4IjhgOKE42zklOXI5zzoXOig6mzqsOwA7CDsQOyE7KTvWPEs8gTySPPg9Hz0nPWY9bj2OPdA92D4OPmw+nT7zPxs/bj92P34/hj+pP7E/uT/BQAJAcUB5",
  "QLdA7EESQVhBl0HdQhZCaULjQydDL0OMQ9lD+EQ5REFEfETeRQ5Fi0WzRftGNEZdRmVGiEaQRphGuEbARshG0Eb4RytHVkeJR8dICUg/SI5I7kknSTJJuUnF",
  "ShJKGkoiSi5KNkrJSyRLLEs4S8pL8UwXTE1MaEyDTItMs0zRTO9M/k0fTVRNgk2RTbtN9k4aTipPAE8XTyNPOE9NT1lPdU/pUF1QhVCFUIVQhVCFUIVQhVCF",
  "UIVQhVCFUIVQhVDnUPJRQ1GTUdRSMVJCUlNSXlJqUrdTBlNOU5ZUI1SrVPBVMlWbVgFWTVaYVvZXUFgtWQxZFFkcWWtZsFoGWk1aXlpqWuda81tUW7RcdV05",
  "XcZeVV6dXuFfCmAcYMBhJGG3YgBiR2KTYxRjQ2NwY+FkNWR6ZL1lP2W+ZfVmKWZhZpxm2GcXZ0pne2ewZ+JoEmg/aLJpBGmHahFqdWrYawNrLms2a2NrmGvU",
  "bAxsQmx3bKts7W0sbXNtvG3xbflugW8Eb4xwEHAYcHRw/3FyccByO3KvcwVzRXN3c6lz5nQldGx0r3S3dRZ1+nYLdhZ2HnYmdnd3JXd7d4N3lHefd7B3vHfN",
  "d9h4J3h1eIZ4knijeK54v3jKeNJ42njrePZ5B3kTeSR5L3lAeUt5XHlneXh5g3msedR55Xnwekd6tnsLe3F7q3vhfBx8JHx8fQd9jn4Ufm5+xn8ef2p/1oBA",
  "gI6A2YEUgU6Br4G3gkmDDIMYgySDqIQvhDeEsITwhT6FhYXohkqGUoazhvSHcofkiBGIGYh/iMaJOImMifqKLYpois6LHItFi9CMN4yGjI6Mlo0FjV2Nw44x",
  "jnuO0Y8mjy6Pm4/6kEKQnpDZkSaRgpHSklKSjJLIktCTG5Nsk9SUK5R3lMGVGZV7lZSVoJXulfaWC5YbliuWN5ZDlk+WW5ZnlnOWhJaPlqCWq5a8lseW2Jbj",
  "l02X+JhsmSCZo5ppmuCbmJwQnPCdU54bniyeOJ6cnz6fT59an2uffJ+In5SfqZ+4n8mf1J/gn+yf+KAJoBWgbaDPoOCg7KD9oQmhGqEmoTehQ6FUoWChcaF9",
  "oY6hmqGrobehyKHUoeWh8aICog6iH6IrojyiSKKWouWi9qMHo12kSKSjpPilRqVOpV+la6V3pYOl/aaQpwynhqeXp6OoCKiFqJaooqj3qZKp+Kpyqu2rQauq",
  "rAysOqx8rPitRq2FrcKuJ65vrneuyq9Dr4ev4bB0sQWxUrG2sfWyTbKfsv6zRrNOs1azXrNms8Ozw7PDs/S0JbRBtE60g7SktMW06bUWtUO1Q7V4tYC2ObZs",
  "tpy2vrbdtwS3NLetuBm4YbjcuSy5+boxumm7LrvIvEO8orzPvPu9PL1/vYe9nL3PvhC+eL7bv0m/j7/xwFDAx8DiwRHBP8FowZPBtcHawgHCDMKzwr/DW8Oc",
  "xAbEjcSbxKPE/MUixTHFOcVFxVHF+sYwxmLGw8c2x1vHt8fJx9XICsguyD3IRchNyFnIdMiIyJjImMiYyJjImMiYyJjImMiYyJjImMiYyJjI5clSylLKW8pj",
  "ymzKdcp+yofKkMqZyqLKq8q0yvrLMMs4y6jL5cwYzEvMiAAAAAIAOf/zAOQCygADAA8AH0AcAAAAAV8AAQFqTQACAgNhAAMDcQNOJCMREAQNGis3IwMzAzQ2",
  "MzIWFRQGIyImy3cZqasyJCMyMiMkMu0B3f18LiUlLiwnJwACAEEByAGXAsoAAwAHACRAIQIBAAABXwUDBAMBAWoATgQEAAAEBwQHBgUAAwADEQYNFysTAyMD",
  "IQMjA8kUYBQBVhRgFALK/v4BAv7+AQIAAAIAFgAAAnACyQAbAB8AR0BEDAoCCA8QDQMHAAgHaA4GAgAFAwIBAgABZwsBCQlqTQQBAgJrAk4AAB8eHRwAGwAb",
  "GhkYFxYVFBMRERERERERERERDR8rAQczFSMHIzcjByM3IzUzNyM1MzczBzM3MwczFQUzNyMB6Bd+kSZrJl8laSR0hxd7jSZrJmEmaSZ1/pdgF2ABnHFlxsbG",
  "xmVxZsfHx8dmcXEAAAMAK//GAhUC9wAiACgALgA/QDwuKSgjGRgVFAgECgEDIAMCAAECTA8BAwFLAAMCAQIDAYAAAQAABAEAaQAEBAJfAAICbAROHhEZFRAF",
  "DRsrNyYmJzUWFhc1LgI1NDY3NTMVFhcHJiYnFR4CFRQGBxUjEQYVFBYXEzY1NCYn/UFmKil0NE1dKHVdQ29bLihRIzZiPWprQz8eIUNCISEoAhUTgRQhA5ce",
  "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",
  "BAJ4Ajw8Oj8ELwQsHiQmBP6AAzs8Oj8ELwMtHiQmBAKbNT1AMiISESOnNT0/MyISESM1PT8zIhIRI/7jND5AMiESECM0PkAyIRIQI/7bNT1AMiETESM1PUAy",
  "IRMRI6M0PkAyIRIQIwAACP3a/ugCJgM0AAgAEQAaACMALAA1AD4ARwBRsQZkREBGGhECAAE3NCwrKCcjHx4bFhUNDA4DADw7MTAEAgMDTAQBAQAAAwEAZwAD",
  "AgIDVwADAwJfAAIDAk8AAEdGQ0IACAAIEwUHFyuxBgBEEwYGByMnNjY3BRYWFwcnJiYnBQYGByc3NjY3ARYWFxUHJiYnJRYWFxUmJic1AxYWFwcmJic3BRcH",
  "BgYHJzY2BQYGByM2NjczQQwXBlIGDCgU/qAbPxo6CRcwEgMyK2AjOQEpZi/8UDJxKwktaS8Dhy1qLjFxLDIXMBIoGz8aOf3gOQEoZy8oK2ABaAwoFDkMFwZS",
  "AzQxcSwJLWougStgIzkBKWYuMRs/GjkKFzAS/s0MFwZSBgwoFDkMKBQ5DBcGUv7tKGcvKSxgIjoYOgkXMBIoGz9XLWkvMnErAAIAWv8wA4ADsgAPACUATUBK",
  "HxYCCAYBTAMBAQIBhQACCgEABgIAaQAICwEJCAljBwEGBiZNBQEEBCcEThAQAQAQJRAlJCMiIRsaGRgSEQwLCQcFBAAPAQ8MBxYrASImJiczFhYzMjY3Mw4C",
  "EzcjETQ2NyMBIxEzERQGBzMBMxEzAwGXWGMqBIUFLjQrNwWHBTBmlFyHBgME/rW2iAMEAwFKtaNXAwMrTjY3JCc0NE8s/C3QAVcxcin93QLK/qcubCsCHv24",
  "/q4AAgBO/zwDFAMNAA8AJQCstiAXAggGAUxLsAxQWEAkAwEBAgGFAAIKAQAGAgBpAAgLAQkICWMHAQYGKE0FAQQEJwROG0uwFVBYQCYDAQECAYUACAsBCQgJ",
  "YwoBAAACYQACAiZNBwEGBihNBQEEBCcEThtAJAMBAQIBhQACCgEABgIAaQAICwEJCAljBwEGBihNBQEEBCcETllZQB8QEAEAECUQJSQjIiEbGhkYEhEMCwkH",
  "BQQADwEPDAcWKwEiJiYnMxYWMzI2NzMOAhM3IzU0NjY3AyMRMxUUBgYHEzMRMwMBZVhjKgSFBS40KzcFhwUwZoRDkAMFAvuzkAMFA/yzkkcCXitONjMoJzQ0",
  "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",
  "AihNBAEDAycDTgAAABIAEhEREhISEREJBx0rExUzFSMREzMDEyMDESMRIzUzNeOamtGk2Oup35VMTAL4T2H+0QEJ/vr+5AEV/usCSGFPAAEAAAAAAuUCygAM",
  "ACtAKAsEAQMAAgFMAAICA18FBAIDAyZNAQEAACcATgAAAAwADBEREhIGBxorCQIjAREjESM1IREBAtf+/AESrP79l58BNgEAAsr+qf6NAWr+lgJMfv6mAVoA",
  "AAEAAAAAArcCIgAMACtAKAsEAQMAAgFMAAICA18FBAIDAyhNAQEAACcATgAAAAwADBEREhIGBxorAQMTIwMRIxEjNSEREwKk2Ouf34uuATnRAiL++v7kARX+",
  "6wGycP73AQkAAQBa/zADNQLKAA8AMEAtAAQAAQYEAWcABggBBwYHYwUBAwMmTQIBAAAnAE4AAAAPAA8RERERERERCQcdKwU1IxEhESMRMxEhETMRMxECo5f+",
  "5ZeXARuXktDQATT+zALK/ugBGP24/q4AAAEATv88As8CIgAPADBALQAEAAEGBAFnAAYIAQcGB2MFAQMDKE0CAQAAJwBOAAAADwAPEREREREREQkHHSsFNSM1",
  "IxUjETMVMzUzETMRAkmW0JWV0JWHxMTh4QIi0tL+S/7PAAABAFoAAANCAsoADQAtQCoAAQAFBAEFZwADAwBfAgEAACZNBwYCBAQnBE4AAAANAA0REREREREI",
  "BxwrMxEzESERIRUjESMRIRFalwEbATafl/7lAsr+6AEYfv20ATT+zAABAE4AAAL2AiIADQAtQCoAAQAFBAEFZwADAwBfAgEAAChNBwYCBAQnBE4AAAANAA0R",
  "EREREREIBxwrMxEzFTM1IRUjESM1IxVOldABQ66V0AIi0tJw/k7h4QABAFr/BgQzAsoAJwBwQBIAAQMAHwEEAxABAgQPAQECBExLsDJQWEAjAAAAAwQAA2kA",
  "BQUHXwAHByZNBgEEBCdNAAICAWEAAQEqAU4bQCAAAAADBAADaQACAAECAWUABQUHXwAHByZNBgEEBCcETllACxERERMnJScxCAceKwE2NjMyHgIVFAYGIyIm",
  "JzUWFjMyNjY1NC4CIyIGBxUjESMRIxEhAnsmRxwzals3S3hGNkUjHz4jK0ImKkJLIRAoFJfzlwIhAYgFAyFMgF5pjkgLDIULDDBUNkFNJwwFBfwCTP20AsoA",
  "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",
  "AbYAAwABBAkBDAAIAHwAAwABBAkBDQASAcYAAwABBAkBDgAKAdgAAwABBAkBDwAKAeIAAwABBAkBEAASAewAAwABBAkBEQASAewAAwABBAkBEgAaAf4AAwAB",
  "BAkBEwAMAhgAAwABBAkBFAAoAiQAAwABBAkBFQAIAkwAAwABBAkBFgAOAlQAQwBvAHAAeQByAGkAZwBoAHQAIAAyADAAMQA1AC0AMgAwADIAMQAgAEcAbwBv",
  "AGcAbABlACAATABMAEMALgAgAEEAbABsACAAUgBpAGcAaAB0AHMAIABSAGUAcwBlAHIAdgBlAGQALgBSAGUAbQBvAGsAIABTAGEAbgBzAEIAbwBsAGQAUgBl",
  "AG0AbwBrAFMAYQBuAHMALQBCAG8AbABkAFIAZQBtAG8AawAgAFMAYQBuAHMAIABCAG8AbABkAFYAZQByAHMAaQBvAG4AIAAyAC4AMAAwADgAOwAgAHQAdABm",
  "AGEAdQB0AG8AaABpAG4AdAAgACgAdgAxAC4AOAApACAALQBsACAAOAAgAC0AcgAgADUAMAAgAC0ARwAgADIAMAAwACAALQB4ACAAMQA0ACAALQBEACAAbABh",
  "AHQAbgAgAC0AZgAgAG4AbwBuAGUAIAAtAGEAIABxAHMAcQAgAC0AWAAgACIAIgBSAGUAZwB1AGwAYQByAFcAZQBpAGcAaAB0AFQAaABpAG4ARQB4AHQAcgBh",
  "AEwAaQBnAGgAdABMAGkAZwBoAHQATQBlAGQAaQB1AG0AUwBlAG0AaQBCAG8AbABkAEUAeAB0AHIAYQBCAG8AbABkAEIAbABhAGMAawBXAGkAZAB0AGgAQwBv",
  "AG4AZABlAG4AcwBlAGQAUwBlAG0AaQBDAG8AbgBkAGUAbgBzAGUAZABOAG8AcgBtAGEAbABDAG8AbgB0AHIAYQBzAHQAIAAoAEcAcgBvAHQAZQBzAHEAdQBl",
  "ACkAVABlAHgAdABEAGkAcwBwAGwAYQB5AAMAAAAAAAD/nAAyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAB//8ADwABAAIADgAAAAAAAABmAAIADgAiADsAAQBC",
  "AFsAAQBqAGoAAQB6AHoAAQCAAJYAAQCYALYAAQC4AUcAAQFWAbMAAQHaAfwAAQH/AgQAAQIIA08AAQNTA1YAAQNuA4gAAQPPA9MAAwABAAEAAAAIAAIAAQPP",
  "A9MAAAABAAAACgAcAB4AAURGTFQACAAEAAAAAP//AAAAAAAAAAEAAAAKADIANAAEREZMVAAaY3lybAAkZ3JlawAkbGF0bgAkAAQAAAAA//8AAAAAAAAAAAAA",
  "AAAAAQABAAgAAwAAABQADwAAACwBBHdnaHQBBQAAd2R0aAEPAAFDVEdSARQAAgAeACoANgBCAE4AWgBmAHIAfgCKAJYAogCuALoAxgABAAAAAAEGAGQAAAAB",
  "AAAAAAEHAMgAAAABAAAAAAEIASwAAAABAAAAAgEJAZAAAAABAAAAAAEKAfQAAAABAAAAAAELAlgAAAABAAAAAAEMArwAAAABAAAAAAENAyAAAAABAAAAAAEO",
  "A4QAAAABAAEAAAEQAD6AAAABAAEAAAERAEsAAAABAAEAAAESAFeAAAABAAEAAgETAGQAAAABAAIAAgEVAAAAAAABAAIAAAEWAGQAAAAA"
].join("")}; })();

// ===== window-sketch =====
(function () {
  'use strict';
  const R = window.Remok;
  const types = { single: { label: 'Одностворчатое окно', count: 1 }, double: { label: 'Двустворчатое окно', count: 2 }, triple: { label: 'Трёхстворчатое окно', count: 3 }, balcony_small: { label: 'Балконный блок малый', count: 2, balcony: true } };
  const openings = { fixed: 'Глухая', turn: 'Поворотная', tilt_turn: 'Поворотно-откидная' };
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const positive = n => Number.isFinite(Number(n)) && Number(n) > 0;
  function openingDescription(s, aluminum=false) {
    const title=(aluminum?{fixed:'Глухая',sliding:'Раздвижная'}:openings)[s.openingType]||'Не указано';
    return title+(!aluminum&&['turn','tilt_turn'].includes(s.openingType)?s.hingeSide==='left'?', петли слева':s.hingeSide==='right'?', петли справа':', петли не указаны':'');
  }
  function drawOpening(line,text,s,l,t,r,b) {
    if(!['turn','tilt_turn'].includes(s.openingType))return;
    if(['left','right'].includes(s.hingeSide)) {
      const hinge=s.hingeSide==='right'?l:r,opposite=s.hingeSide==='right'?r:l;
      // Preserve the existing symbols; only their left/right binding is inverted.
      line(opposite,t,hinge,(t+b)/2);line(hinge,(t+b)/2,opposite,b);
      const mark=Math.min(4,(r-l)/8),gap=Math.min(5,(b-t)/5);line(hinge-mark,t+gap,hinge+mark,t+gap);line(hinge-mark,b-gap,hinge+mark,b-gap);
    } else text((l+r)/2,(t+b)/2,'?');
    if(s.openingType==='tilt_turn'){line(l,b,(l+r)/2,t);line((l+r)/2,t,r,b);}
  }

  function viewport(width, height, availableWidth = 300, availableHeight = 190) {
    const scale = Math.min(availableWidth / width, availableHeight / height);
    const drawWidth = width * scale, drawHeight = height * scale;
    // Reserve readable annotation margins outside uniformly scaled geometry.
    const viewWidth = Math.max(260, drawWidth + 140), viewHeight = drawHeight + 100;
    return { scale, drawWidth, drawHeight, x: (viewWidth-drawWidth)/2, y: 46, width: viewWidth, height: viewHeight };
  }
  function equalize(product) {
    const type = types[product.productType]; if (!type) return;
    const width = positive(product.width) ? Number(product.width) : 0;
    const part = Math.floor(width / type.count);
    product.sections = Array.from({ length: type.count }, (_, i) => ({ ...(product.sections?.[i] || {hingeSide:'left'}), widthMm: width ? (i === type.count - 1 ? width - part * i : part) : '', openingType: product.sections?.[i]?.openingType || 'fixed' }));
    product.sectionWidthsAuto = true;
  }
  function sectionData(product) {
    const type = types[product.productType];
    const sections = Array.from({ length: type?.count || 0 }, (_, i) => product.sections?.[i] || {});
    const sum = sections.reduce((s, p) => s + (Number(p.widthMm) || 0), 0);
    const valid = sections.length > 0 && sections.every(p => positive(p.widthMm)) && positive(product.width) && Math.abs(sum - Number(product.width)) < 0.01;
    return { sections, sum, valid };
  }
  function characteristics(product, hardwareDefault = 'Стандартная') {
    if (product.mode !== 'glazing') return [];
    const type = types[product.productType], data = sectionData(product);
    const configuration = type ? data.sections.map((s, i) => (type.balcony ? (i === 0 ? 'Окно: ' : 'Дверь: ') : '') + openingDescription(s)).join(' / ') : 'Не указана';
    return ['Размер: ' + product.width + ' × ' + product.height + ' мм', 'Профиль: ' + R.profiles.name(product), 'Ламинация: ' + (R.labels.lamination[product.lamination || 'none'] || 'Не указана'), 'Фурнитура: ' + (product.hardware?.trim() || hardwareDefault), 'Конфигурация: ' + configuration,
      ...(type?.balcony ? ['Дверь ' + (product.doorSide === 'left' ? 'слева' : 'справа')] : [])];
  }
  // Coordinates and primitives are shared by SVG and jsPDF. No price data here.
  function geometry(product, options = {}) {
    const custom = R.v2?.geometry(product, options); if (custom !== undefined) return custom;
    const type = types[product.productType]; if (!type) return null;
    const data = sectionData(product), primitives = [];
    const transom = product.mode === 'glazing' && ['single','double','triple'].includes(product.productType) && product.hasTopTransom;
    if (transom && !(positive(product.transomHeightMm) && Number(product.transomHeightMm) < Number(product.height))) return null;
    if (!positive(product.width) || !positive(product.height)) return null;
    const view = viewport(Number(product.width), Number(product.height));
    const {drawHeight:h,drawWidth:w,x,y} = view;
    const line = (x1, y1, x2, y2) => primitives.push({ kind: 'line', x1, y1, x2, y2 });
    const rect = (x, y, width, height) => primitives.push({ kind: 'rect', x, y, width, height });
    const text = (x, y, value) => primitives.push({ kind: 'text', x, y, text: String(value) });
    const order = type.balcony && product.doorSide === 'left' ? [1, 0] : data.sections.map((_, i) => i);
    const topHeight = transom ? h * Number(product.transomHeightMm) / Number(product.height) : 0;
    if (transom) { rect(x,y,w,topHeight); const inset=Math.min(7,topHeight/4); rect(x+inset,y+inset,w-2*inset,topHeight-2*inset); line(x-9,y,x-9,y+topHeight); line(x-14,y,x-4,y); line(x-14,y+topHeight,x-4,y+topHeight); text(x-29,y+topHeight/2,product.transomHeightMm); }
    let cursor = x;
    for (const index of order) {
      const s = data.sections[index];
      const sw = w * (data.valid ? Number(s.widthMm) / Number(product.width) : 1 / type.count);
      const sh = type.balcony && index === 0 ? h * 0.65 : h - topHeight, baseY = y + topHeight;
      rect(cursor, baseY, sw, sh);
      const inset = Math.min(7, sw / 6), verticalInset=Math.min(7,sh/5), l = cursor + inset, r = cursor + sw - inset, t = baseY + verticalInset, b = baseY + sh - verticalInset;
      rect(l, t, r - l, b - t);
      drawOpening(line,text,s,l,t,r,b);
      if (!options.preview) {
        line(cursor, y - 12, cursor + sw, y - 12); line(cursor, y - 17, cursor, y - 7); line(cursor + sw, y - 17, cursor + sw, y - 7);
        text(cursor + sw / 2, y - 21, positive(s.widthMm) ? s.widthMm : '—');
      }
      cursor += sw;
    }
    if (!options.preview) {
      line(x, y + h + 18, x + w, y + h + 18); line(x, y + h + 11, x, y + h + 24); line(x + w, y + h + 11, x + w, y + h + 24);
      text(x + w / 2, y + h + 36, positive(product.width) ? product.width : '—');
      line(x + w + 15, y, x + w + 15, y + h); line(x + w + 9, y, x + w + 21, y); line(x + w + 9, y + h, x + w + 21, y + h);
      text(x + w + 44, y + h / 2, positive(product.height) ? product.height : '—');
    }
    return { ...view, primitives, title: type.label, note: options.preview ? '' : 'Размеры в мм. Эскиз схематичный.' + (!data.valid ? ' Ширины секций не согласованы: показаны равные пропорции.' : '') + (type.balcony ? ' Высота оконной части условная, не является замером.' : '') };
  }
  function renderWindowSketch(product, options = {}) {
    const model = options.model || geometry(product, options); if (!model && product.hasTopTransom && ['single','double','triple'].includes(product.productType)) return '<p class="remok-warning">Для эскиза укажите высоту фрамуги больше нуля и меньше общей высоты окна.</p>'; if (!model) return '<p class="remok-help">Тип изделия и конфигурация не указаны. Эскиз недоступен.</p>';
    const shapes = model.primitives.map(p => p.kind === 'line' ? `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}"/>` : p.kind === 'rect' ? `<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}"/>` : `<text x="${p.x}" y="${p.y}">${escape(p.text)}</text>`).join('');
    return `<figure class="remok-sketch"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${model.width} ${model.height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escape(model.title)}"><g fill="none" stroke="currentColor" stroke-width="1.5">${shapes}</g></svg>${model.note ? '<figcaption>' + escape(model.note) + '</figcaption>' : ''}</figure>`;
  }
  function drawPdf(doc, model, x, y, width, height) {
    const scale = Math.min(width / model.width, height / model.height);
    const dx = x + (width - model.width * scale) / 2;
    doc.setDrawColor(0); doc.setTextColor(0); doc.setLineWidth(0.25); doc.setFont('RemokSans', 'normal'); doc.setFontSize(9);
    for (const p of model.primitives) {
      if (p.kind === 'line') doc.line(dx + p.x1 * scale, y + p.y1 * scale, dx + p.x2 * scale, y + p.y2 * scale);
      else if (p.kind === 'rect') doc.rect(dx + p.x * scale, y + p.y * scale, p.width * scale, p.height * scale);
      else doc.text(p.text.replace('—', '-'), dx + p.x * scale, y + p.y * scale, { align: 'center' });
    }
  }
  R.windowSketch = { viewport, openingDescription, drawOpening, types, openings, equalize, sectionData, characteristics, geometry, renderWindowSketch, drawPdf };
})();

// ===== v2-model =====
(function () {
  'use strict';
  const R = window.Remok, C = R.calc, S = R.windowSketch, originalProduct = C.product, originalBalcony = C.balcony;
  const shapes = { straight: 'Прямое', l: 'Г-образное', u: 'П-образное' };
  const planeNames = { left: 'Левая сторона', facade: 'Фасад', right: 'Правая сторона' };
  const aluminumOpenings = { fixed: 'Глухая', sliding: 'Раздвижная' };
  const parts = () => ({ enabled: false, type: '', depth: '', depthChecked: false, hasDepthDifference: false, comment: '' });
  const newPlane = id => ({ id, widthMm: '', heightMm: '', sectionCount: 4, sections: [], sectionWidthsAuto: true, heightMode: 'normal', upperHeightMm: '', lowerHeightMm: '', lowerFilling: 'glass', exterior: parts(), interior: parts() });
  const blockWindows = p => Array.isArray(p.windows) ? p.windows : [{...p.sections?.[0],widthMm:p.windowWidthMm}];
  const doorPosition = p => p.doorPosition || p.doorSide || 'right';
  function blockParts(p) {
    const windows=blockWindows(p).map((v,i)=>({...v,heightMm:p.windowHeightMm,label:'Окно '+(i+1)}));
    const door={...p.sections?.[1],widthMm:p.doorWidthMm,heightMm:p.doorHeightMm,label:'Дверь',door:true};
    const position=doorPosition(p),index=position==='left'?0:position==='middle'&&windows.length===2?1:windows.length;
    windows.splice(index,0,door);return windows;
  }
  const workPrice = w => w.flat ? Number(w.amount)||0 : (Number(w.quantity)||0)*(Number(w.rate)||0);
  const workValid = w => typeof w.name==='string' && w.name.trim() && (w.flat ? C.nonnegative(w.amount) : C.positive(w.quantity)&&C.nonnegative(w.rate));
  function withWorks(result,item) {
    const works=item.additionalWorks||[], valid=works.filter(workValid), additionalWorksTotal=valid.reduce((sum,w)=>sum+workPrice(w),0);
    return {...result,baseTotal:result.total,additionalWorksTotal,total:result.total+additionalWorksTotal,
      errors:[...result.errors,...(works.some(w=>!workValid(w))?['Завершите дополнительные работы изделия.']:[])],
      lines:[...result.lines,...valid.map(w=>({kind:'item-work',title:'Доп. работа: '+w.name,detail:w.comment||'',price:workPrice(w)}))]};
  }
  const modernBlock = p => p.mode === 'glazing' && p.productType === 'balcony_small' && (p.geometryVersion === 2 || Array.isArray(p.windows) || ['windowWidthMm','windowHeightMm','doorWidthMm','doorHeightMm'].some(k => Object.hasOwn(p,k)));
  function planeIds(p) { return p.balconyGlazingShape === 'u' ? ['left','facade','right'] : p.balconyGlazingShape === 'l' ? (p.sidePosition === 'left' ? ['left','facade'] : ['facade','right']) : ['facade']; }
  function planes(p) { return planeIds(p).map(id => p.planes?.find(v => v.id === id) || newPlane(id)); }
  function equalPlane(p) {
    const n = Math.max(1, Math.min(8, Math.floor(Number(p.sectionCount) || 1))), w = Number(p.widthMm) || 0, part = Math.floor(w/n);
    p.sections = Array.from({length:n}, (_,i) => ({ ...(p.sections?.[i] || {hingeSide:'left'}), widthMm:w ? (i===n-1 ? w-part*i : part) : '', openingType:p.sections?.[i]?.openingType || 'fixed' })); p.sectionWidthsAuto = true;
  }
  function measure(p) {
    const errors = []; let area = 0, sandwichArea = 0;
    if (p.mode==='glazing' && ['single','double','triple'].includes(p.productType) && p.hasTopTransom && !(C.positive(p.transomHeightMm) && Number(p.transomHeightMm)<Number(p.height))) errors.push('Высота верхней фрамуги должна быть больше нуля и меньше общей высоты окна.');
    if (p.mode === 'balcony-glazing') {
      if (!['pvc','aluminum'].includes(p.balconyGlazingMaterial)) errors.push('Выберите тип конструкции.');
      if (!shapes[p.balconyGlazingShape]) errors.push('Выберите форму остекления.');
      planes(p).forEach(plane => {
        const a = C.area(plane.widthMm,plane.heightMm);
        if (a === null) errors.push(planeNames[plane.id]+': укажите ширину и высоту.'); else area += a;
        if (!Number.isInteger(Number(plane.sectionCount)) || plane.sectionCount < 1 || plane.sectionCount > 8) errors.push(planeNames[plane.id]+': количество секций от 1 до 8.');
        if (plane.heightMode === 'floor') {
          if (!C.positive(plane.upperHeightMm) || !C.positive(plane.lowerHeightMm) || Math.abs(Number(plane.upperHeightMm)+Number(plane.lowerHeightMm)-Number(plane.heightMm))>0.01) errors.push(planeNames[plane.id]+': сумма высот ярусов должна совпадать с общей высотой.');
          else if (plane.lowerFilling === 'sandwich' && a !== null) sandwichArea += Number(plane.widthMm)*Number(plane.lowerHeightMm)/1e6;
        }
      });
    } else if (modernBlock(p)) {
      const windows=blockWindows(p),areas=windows.map(w=>C.area(w.widthMm,p.windowHeightMm)),d=C.area(p.doorWidthMm,p.doorHeightMm);
      if(![1,2].includes(windows.length)||areas.some(a=>a===null)||d===null) errors.push('Укажите положительные размеры всех окон и двери.');
      else area=areas.reduce((sum,a)=>sum+a,0)+d;
      if(!['left','right',...(windows.length===2?['middle']:[])].includes(doorPosition(p))) errors.push('Выберите допустимое положение двери.');
    } else area=C.area(p.width,p.height)||0;
    return { area, sandwichArea, glassArea:area-sandwichArea, errors };
  }
  function finishDimensions(p) { return modernBlock(p) ? { width:blockWindows(p).reduce((sum,w)=>sum+Number(w.widthMm),0)+Number(p.doorWidthMm),height:Number(p.doorHeightMm) } : {width:p.width,height:p.height}; }
  function product(p,pricing) {
    pricing=R.profiles.forItem(p,pricing);
    const m=measure(p); let base, material=p.mode==='aluminum'?'aluminum':'pvc';
    if(p.mode==='balcony-glazing') {
      material=p.balconyGlazingMaterial;
      const results=planes(p).map(v=>originalProduct({...p,mode:material==='aluminum'?'aluminum':'glazing',width:v.widthMm,height:v.heightMm,exterior:v.exterior||parts(),interior:v.interior||parts()},pricing));
      const all=results.flatMap(r=>r.lines);
      base={lines:[{title:'Остекление',price:all.filter(l=>l.title==='Остекление').reduce((s,l)=>s+l.price,0)},...results.flatMap((r,i)=>r.lines.filter(l=>l.title!=='Остекление').map(l=>({...l,detail:planeNames[planes(p)[i].id]+' · '+l.detail})))], errors:[...m.errors,...results.flatMap(r=>r.errors)],total:results.reduce((s,r)=>s+r.total,0)};
    } else {
      base=originalProduct({...p,...finishDimensions(p)},pricing);
      if (!modernBlock(p)) base.errors.push(...m.errors);
      if(modernBlock(p)) {
        const old=base.lines.find(l=>l.title==='Остекление');
        const price=C.calculateGlazing(m.area*1e6,1,p.profile,pricing,p.lamination||'none');
        if(old&&price!==null) {base.total+=price-old.price;old.price=price;}
        else if(old) {base.total-=old.price;base.lines=base.lines.filter(l=>l!==old);}
        base.errors.push(...m.errors);
      }
    }
    const adjustment=p.mode==='balcony-glazing'?m.sandwichArea*pricing.sandwichDiscountPerM2:0;
    const installation=m.area*pricing.installationDisplayRatePerM2;
    const line=base.lines.find(l=>l.title==='Остекление');
    if(line) {
      const index=base.lines.indexOf(line), construction=line.price-adjustment-installation;
      if(construction<0) base.errors.push('Стоимость конструкции ниже выделенного монтажа. Проверьте ставки монтажа и сэндвича в настройках.');
      base.lines.splice(index,1,{...line,kind:'construction',title:material==='aluminum'?'Алюминиевая конструкция':'Профиль '+R.profiles.name(p,pricing),detail:'',price:construction},{kind:'installation',title:'Монтаж с расходными материалами',detail:'',price:installation});
      base.total-=adjustment;
    }
    return withWorks({...base,area:m.area,sandwichArea:m.sandwichArea,glassArea:m.glassArea,sandwichAdjustment:adjustment,installationDisplayPrice:line?installation:0},p);
  }
  function sync(p,pricing) {
    R.profiles.capture(p,pricing);
    if(modernBlock(p)) {const dim=finishDimensions(p);p.width=dim.width||'';p.height=dim.height||'';p.sections=p.sections||[{},{}];p.sections[0]={...p.sections[0],...blockWindows(p)[0]};p.sections[1]={...p.sections[1],widthMm:p.doorWidthMm};}
    if(p.mode==='balcony-glazing') p.sandwichAdjustment=measure(p).sandwichArea*pricing.sandwichDiscountPerM2;
  }
  const fmt=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:3}).format(n);
  function planeCharacteristics(p,material) {return [planeNames[p.id]+': '+p.widthMm+' × '+p.heightMm+' мм', 'Секции: '+(p.sections||[]).map(s=>s.widthMm||'—').join(' / ')+' мм', 'Открывание: '+(p.sections||[]).map(s=>S.openingDescription(s,material==='aluminum')).join(' / '), ...(p.heightMode==='floor'?['В пол: верх '+p.upperHeightMm+' мм, низ '+p.lowerHeightMm+' мм; нижнее заполнение — '+(p.lowerFilling==='sandwich'?'сэндвич-панель':'стекло')]:[])];}
  function characteristics(p,hw) {
    if(p.mode==='balcony-glazing') {const m=measure(p),pvc=p.balconyGlazingMaterial==='pvc';return ['Тип конструкции: '+(pvc?'ПВХ':'Алюминий'),'Форма: '+(shapes[p.balconyGlazingShape]||'Не указана'),pvc?'Профиль: '+R.profiles.name(p):'Система: холодное алюминиевое остекление',pvc?'Ламинация: '+R.labels.lamination[p.lamination||'none']:'Цвет: '+R.labels.aluminumColors[p.aluminumColor||'white'],'Фурнитура: '+(p.hardware||hw),'Общая площадь: '+fmt(m.area)+' м²','Стекло: '+fmt(m.glassArea)+' м²',...(m.sandwichArea?['Сэндвич-панель: '+fmt(m.sandwichArea)+' м²']:[])];}
    const rows=p.mode==='aluminum'?['Размер: '+p.width+' × '+p.height+' мм','Система: холодное алюминиевое остекление','Цвет: '+R.labels.aluminumColors[p.aluminumColor||'white'],'Фурнитура: '+(p.hardware||hw),...(p.sections?.length?['Открывание: '+p.sections.map(s=>aluminumOpenings[s.openingType]||'Не указано').join(' / ')]:[])]:S.characteristics(p,hw);
    if(modernBlock(p)) {
      const windowRows=blockWindows(p).map((w,i)=>'Окно '+(i+1)+': '+w.widthMm+' × '+p.windowHeightMm+' мм · '+S.openingDescription(w));
      return [...windowRows,'Дверь: '+p.doorWidthMm+' × '+p.doorHeightMm+' мм · '+S.openingDescription(p.sections?.[1]||{}),
        'Положение: '+({left:'дверь слева',middle:'дверь между окнами',right:'дверь справа'}[doorPosition(p)]||'не указано'),
        'Площадь: '+fmt(measure(p).area)+' м²',...rows.filter(t=>/^(Профиль|Ламинация|Фурнитура):/.test(t))];
    }
    if(p.mode==='glazing' && ['single','double','triple'].includes(p.productType) && p.hasTopTransom) rows.push('Верхняя фрамуга: глухая, '+p.transomHeightMm+' мм', 'Высота нижней части: '+(Number(p.height)-Number(p.transomHeightMm))+' мм');
    return rows;
  }
  // Extend the existing primitive model; the same primitives feed SVG and PDF.
  function geometry(p,options={}) {
    const block=modernBlock(p), plane=p.sketchPlane, aluminum=p.mode==='aluminum'&&p.sections?.length;
    if(!block&&!plane&&!aluminum) return undefined;
    const width=block?finishDimensions(p).width:Number(plane?p.widthMm:p.width);
    const height=block?Math.max(Number(p.windowHeightMm),Number(p.doorHeightMm)):Number(plane?p.heightMm:p.height);
    if(!C.positive(width)||!C.positive(height)) return null;
    const n=block?blockParts(p).length:plane?Math.max(1,Math.min(8,Number(p.sectionCount)||1)):p.sections.length;
    const sections=block?blockParts(p):Array.from({length:n},(_,i)=>p.sections?.[i]||{}), sum=sections.reduce((s,v)=>s+(Number(v.widthMm)||0),0);
    const valid=sections.every(s=>C.positive(s.widthMm))&&Math.abs(sum-width)<.01;
    const primitives=[], view=S.viewport(width,height,420), {drawHeight:h,drawWidth:w,x,y}=view;
    const line=(x1,y1,x2,y2)=>primitives.push({kind:'line',x1,y1,x2,y2}),rect=(x,y,width,height)=>primitives.push({kind:'rect',x,y,width,height}),text=(x,y,text)=>primitives.push({kind:'text',x,y,text:String(text)});
    const dimH=(x1,x2,yy,value)=>{line(x1,yy,x2,yy);line(x1,yy-4,x1,yy+4);line(x2,yy-4,x2,yy+4);text((x1+x2)/2,yy-7,value);};
    const dimV=(xx,y1,y2,value,side)=>{line(xx,y1,xx,y2);line(xx-4,y1,xx+4,y1);line(xx-4,y2,xx+4,y2);text(xx+(side==='left'?-27:27),(y1+y2)/2,value);};
    const order=sections.map((_,i)=>i);let cursor=x;
    order.forEach(i=>{
      const s=sections[i], sw=w*(block?Number(s.widthMm)/width:valid?Number(s.widthMm)/width:1/n),sh=block?h*Number(s.heightMm)/height:h;
      const floor=plane&&p.heightMode==='floor',upper=floor&&C.positive(p.upperHeightMm)&&C.positive(p.lowerHeightMm)?sh*Number(p.upperHeightMm)/(Number(p.upperHeightMm)+Number(p.lowerHeightMm)):floor?sh*.6:sh;
      rect(cursor,y,sw,sh);const inset=Math.min(5,sw/5),vi=Math.min(5,upper/5),l=cursor+inset,r=cursor+sw-inset,t=y+vi,b=y+upper-vi;rect(l,t,r-l,Math.max(1,b-t));
      const openingType=p.mode==='aluminum'&&!(s.openingType in aluminumOpenings)?'':s.openingType;
      S.drawOpening(line,text,{...s,openingType},l,t,r,b);
      if(openingType==='sliding'){const mid=(t+b)/2;line(l,mid,r,mid);line(r-5,mid-4,r,mid);line(r-5,mid+4,r,mid);}
      if(floor){line(cursor,y+upper,cursor+sw,y+upper);const top=y+upper+5, bottom=y+sh-5;rect(l,top,r-l,Math.max(1,bottom-top));if(p.lowerFilling==='sandwich')for(let yy=top;yy<bottom;yy+=9){const length=Math.min(r-l,bottom-yy);line(l,yy,l+length,yy+length);}}
      dimH(cursor,cursor+sw,y-13,s.widthMm||'—');
      if(block && (i===0 || s.heightMm!==sections[0].heightMm)) dimV(i===0?x-13:x+w+13,y,y+sh,s.heightMm,i===0?'left':'right');
      cursor+=sw;
    });
    dimH(x,x+w,y+h+27,width);
    if(!block){dimV(x+w+13,y,y+h,height,'right');if(plane&&p.heightMode==='floor'){const upper=h*Number(p.upperHeightMm)/(Number(p.upperHeightMm)+Number(p.lowerHeightMm)||1);dimV(x-13,y,y+upper,p.upperHeightMm||'—','left');dimV(x-13,y+upper,y+h,p.lowerHeightMm||'—','left');}}
    return {...view,primitives,title:block?'Балконный блок малый':plane?planeNames[p.id]:'Алюминиевое остекление',note:'Размеры в мм. Техническая схема.'+(!block&&!valid?' Ширины секций не согласованы: показаны равные пропорции.':'')};
  }
  function sketches(p){return p.mode==='balcony-glazing'?planes(p).map(v=>({title:planeNames[v.id],model:geometry({...v,sketchPlane:true}),characteristics:planeCharacteristics(v,p.balconyGlazingMaterial)})):[{title:'',model:S.geometry(p),characteristics:[]}].filter(v=>v.model);}
  R.v2={blockWindows,blockParts,doorPosition,workPrice,workValid,shapes,planeNames,aluminumOpenings,newPlane,planes,planeIds,equalPlane,modernBlock,measure,finishDimensions,sync,characteristics,geometry,sketches};
  C.product=product;
  C.balcony=(p,pricing)=>withWorks(originalBalcony(p,pricing),p);
})();

// ===== pdf =====
(function () {
  'use strict';
  const R = window.Remok;
  let cache = null, activeLinkUrl = null;
  const urls = new Map();
  const clean = value => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/[\u00a0\u202f]/g, ' ').replace(/[\u2010-\u2015]/g, '-');
  const money = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value).replace(/[\u00a0\u202f]/g, ' ') + ' руб.';
  function fileName(client) {
    const suffix = String(client.address || client.name || '').trim().replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^[. -]+|[. -]+$/g, '').slice(0, 70).replace(/[. -]+$/g, '');
    return 'REMOK_КП' + (suffix ? '_' + suffix : '') + '.pdf';
  }
  function generateEstimatePdf(data) {
    const key = JSON.stringify(data);
    if (cache?.key === key) return cache.result;
    if (!window.jspdf?.jsPDF || !R.pdfFonts) throw new Error('PDF resources unavailable');
    const doc = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true, putOnlyUsedFonts: true });
    for (const [style, name] of [['regular', 'normal'], ['bold', 'bold']]) {
      doc.addFileToVFS('RemokSans-' + style + '.ttf', R.pdfFonts[style]);
      doc.addFont('RemokSans-' + style + '.ttf', 'RemokSans', name);
    }
    doc.setProperties({ title: data.document?.title || 'Коммерческое предложение REMOK', author: 'REMOK', creator: 'REMOK' });
    const left = 16, right = 194, top = 18, bottom = 278, width = right - left, lineHeight = 5.4;
    let y = top;
    function font(size = 10, bold = false) { doc.setFont('RemokSans', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(0); }
    function newPage() { doc.addPage(); y = top; }
    function space(height) { if (y + height > bottom) newPage(); }
    function textLines(text, size = 10, bold = false, maxWidth = width) {
      font(size, bold); return doc.splitTextToSize(clean(text), maxWidth);
    }
    function paragraph(text, size = 10, bold = false, gap = 2) {
      const lines = textLines(text, size, bold), step = Math.max(lineHeight, size * 0.46);
      for (const line of lines) { space(step); font(size, bold); doc.text(line, left, y); y += step; }
      y += gap;
    }
    function layoutRow(row) {
      const amount = money(row.price);
      font(row.total ? 12 : 10, !!row.total);
      const amountWidth = Math.max(40, doc.getTextWidth(amount) + 3);
      if (amountWidth > width - 30) throw new Error('Amount too wide');
      const lines = textLines(row.label, row.total ? 11 : 10, !!row.total, width - amountWidth - 6);
      return { ...row, amount, lines, height: Math.max(1, lines.length) * lineHeight + (row.total ? 5 : 3) };
    }
    function drawRow(row) {
      if (row.height <= bottom - top) space(row.height);
      if (row.total) { doc.setDrawColor(175); doc.setLineWidth(0.2); doc.line(left, y - 4.5, right, y - 4.5); }
      row.lines.forEach((line, index) => {
        space(lineHeight); font(row.total ? 11 : 10, !!row.total); doc.text(line, left, y);
        if (index === 0) { font(row.total ? 12 : 10, !!row.total); doc.text(row.amount, right, y, { align: 'right' }); }
        y += lineHeight;
      });
      y += row.total ? 5 : 3;
    }
    function block(title, subtitle, rows, details = {}) {
      const laidOut = rows.map(layoutRow);
      const titleHeight = textLines(title, 13, true).length * 6 + 3;
      const subtitleHeight = subtitle ? textLines(subtitle, 10).length * lineHeight + 3 : 0;
      const notes = details.characteristics || [];
      const sketches = (details.sketches || []).filter(s=>s.model);
      const sketchBlockHeight = s => 64 + textLines(s.title ? title + ' · ' + s.title : '').length * lineHeight + [...(s.characteristics||[]), s.model.note].filter(Boolean).reduce((sum,t)=>sum+textLines(t).length*lineHeight+1,0);
      const notesHeight = notes.reduce((sum, note) => sum + textLines(note).length * lineHeight + 1, 0);
      const sketchHeight = sketches.reduce((sum,s)=>sum+sketchBlockHeight(s),0);
      const height = titleHeight + subtitleHeight + sketchHeight + notesHeight + laidOut.reduce((s, r) => s + r.height, 0) + 4;
      // Keep an entire product together whenever it can fit on a fresh A4 page.
      if (height <= bottom - top) space(height);
      else space(Math.min(bottom - top, titleHeight + subtitleHeight + Math.min(sketchHeight, 110) + Math.min(notesHeight, 15)));
      paragraph(title, 13, true, 3);
      if (subtitle) paragraph(subtitle, 10, false, 3);
      notes.forEach(note => paragraph(note, 10, false, 1));
      sketches.forEach(s => {
        space(Math.min(bottom-top,sketchBlockHeight(s)));
        if(s.title) paragraph(title + ' · ' + s.title,11,true,2);
        R.windowSketch.drawPdf(doc,s.model,left,y,width,59);y+=62;
        [...(s.characteristics||[]),s.model.note].filter(Boolean).forEach(t=>paragraph(t,10,false,1));
      });
      laidOut.forEach(drawRow); y += 4;
    }
    paragraph(data.company?.name || 'ООО «Ремок»', 17, true, 1);
    paragraph(data.document?.title || 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ', 19, true, 4);
    if (data.document?.date) paragraph('Дата: ' + data.document.date);
    if (data.client.name?.trim()) paragraph('Заказчик: ' + data.client.name);
    if (data.client.phone?.replace(/\D/g, '').length > 1) paragraph('Телефон: ' + data.client.phone);
    if (data.client.address?.trim()) paragraph('Объект: ' + data.client.address);
    y += 3;
    data.products.forEach(item => block(item.title, item.subtitle, [...item.lines, { label: 'Итого по изделию', price: item.total, total: true }], item));
    if (data.balcony) block('ОТДЕЛКА БАЛКОНА', '', [...data.balcony.lines, { label: 'Итого балкон', price: data.balcony.total, total: true }]);
    if (data.works.length) block('Дополнительные работы по заказу', '', data.works);
    const totals = [{ label: 'Стоимость до скидки', price: data.totals.sub }];
    totals.push({ label: 'Скидка', price: data.totals.sub - data.totals.final });
    totals.push({ label: 'ИТОГОВАЯ СТОИМОСТЬ', price: data.totals.final, total: true });
    const finalRows = totals.map(layoutRow); space(finalRows.reduce((sum, row) => sum + row.height, 0)); finalRows.forEach(drawRow);
    const company = data.company || R.company;
    const companyLines = ['ИНН ' + company.inn + ' · КПП ' + company.kpp + (company.ogrn ? ' · ОГРН ' + company.ogrn : ''), company.address, ...((company.phone || company.email) ? [[company.phone, company.email].filter(Boolean).join(' · ')] : [])];
    space(14 + companyLines.reduce((sum, text) => sum + textLines(text).length * lineHeight + 1, 0));
    y += 5; paragraph(company.name + ' · Реквизиты компании', 12, true, 3); companyLines.forEach(text => paragraph(text, 10, false, 1));
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) { doc.setPage(i); font(8); doc.text('REMOK · ' + i + ' / ' + pages, right, 288, { align: 'right' }); }
    const result = { blob: doc.output('blob'), fileName: fileName(data.client) };
    if (!(result.blob instanceof Blob) || !result.blob.size) throw new Error('Empty PDF');
    cache = { key, result };
    return result;
  }
  function revoke(url) {
    const record = urls.get(url);
    if (record?.timer) clearInterval(record.timer);
    URL.revokeObjectURL(url); urls.delete(url);
    if (activeLinkUrl === url) activeLinkUrl = null;
  }
  function releaseLink() {
    if (activeLinkUrl) {
      const url = activeLinkUrl; activeLinkUrl = null;
      if (!urls.get(url)?.preview) revoke(url);
    }
  }
  function isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  function deliver(result, { allowPopup = true, message = '' } = {}) {
    releaseLink();
    const url = URL.createObjectURL(result.blob); activeLinkUrl = url;
    const record = {}; urls.set(url, record);
    const host = document.getElementById('remok-pdf-status');
    const link = document.createElement('a');
    link.href = url; link.textContent = 'Открыть / сохранить PDF'; link.target = '_blank'; link.rel = 'noopener';
    const ios = isIOS();
    if (!ios) link.download = result.fileName;
    if (host) { host.replaceChildren(); const text = document.createElement('span'); text.textContent = message || 'PDF создан. '; host.append(text, document.createTextNode(' '), link); }
    // Called synchronously from the original click, never after an awaited share.
    if (ios && allowPopup) {
      const preview = window.open(url, '_blank');
      if (preview) {
        preview.opener = null; record.preview = preview;
        record.timer = setInterval(() => { if (preview.closed) { record.preview = null; clearInterval(record.timer); if (activeLinkUrl !== url) revoke(url); } }, 2000);
      }
      // If popups are blocked, the visible link remains a fresh user gesture.
    } else if (!ios) {
      const download = document.createElement('a'); download.href = url; download.download = result.fileName;
      download.hidden = true; document.getElementById('remok-estimator').append(download); download.click(); download.remove();
    }
  }
  window.addEventListener('pagehide', () => { for (const url of urls.keys()) revoke(url); cache = null; });
  R.pdf = { generateEstimatePdf, deliver, releaseLink, fileName };
})();

// ===== app =====
(function () {
  'use strict';
  const R = window.Remok, C = R.calc, L = R.labels, S = R.windowSketch, V = R.v2;
  const root = document.getElementById('remok-estimator'), main = document.getElementById('remok-main');
  const mainTypes = { ...L.types, balcony: 'Отделка балкона' };
  let pricing = R.storage.pricing(), toastTimer;
  const clone = o => JSON.parse(JSON.stringify(o));
  const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  const wall = () => ({ width: '', height: '', hasOpenings: false, openings: [] });
  const freshBalcony = () => ({ enabled: false, saved: false, walls: { enabled: false, material: 'pvc', insulated: false, items: [wall()] }, floor: { enabled: false, length: '', width: '', material: 'laminate', insulated: false }, ceiling: { enabled: false, length: '', width: '', material: 'pvc', insulated: false }, electricity: { enabled: false, base: false, addPoints: false, points: '' }, warmFloor: { enabled: false } });
  const fresh = () => ({ version: 1, client: { name: '', phone: '+7', address: '', contactPreference: 'phone', telegramUsername: '' }, step: 'start', items: [], draft: null, nextNumber: 1, balcony: freshBalcony(), works: [], discount: 0, discountMode: 'none', targetPrice: '', targetSignature: null, targetStale: false, returnToEstimate: false });
  let state = R.storage.read('estimate');
  if (!state || state.version !== 1 || !Array.isArray(state.items) || !state.client || !state.balcony || !Array.isArray(state.works)) state = fresh();
  if (!state.discountMode) state.discountMode = state.targetMode ? 'target' : Number(state.discount) ? 'percent' : 'none';
  state.client.phone = formatPhone(state.client.phone);
  state.client.contactPreference ||= 'phone'; state.client.telegramUsername ||= '';
  if (state.step === 'balcony-question') state.step = 'estimate';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const money = n => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽';
  const decimal = n => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(n);
  function get(path) { return path.split('.').reduce((o, k) => o?.[k], state); }
  function set(path, value) { const keys = path.split('.'), last = keys.pop(); keys.reduce((o, k) => o[k], state)[last] = value; }
  function persist() {
    state.items.forEach(p => V.sync(p, pricing)); if (state.draft) V.sync(state.draft, pricing);
    checkFixedPrice();
    const ok = R.storage.write('estimate', state);
    document.getElementById('remok-storage').textContent = ok ? 'Все изменения сохранены на этом устройстве' : 'Не удалось сохранить. Проверьте доступ к хранилищу браузера.';
    document.getElementById('remok-storage').className = ok ? '' : 'remok-danger';
  }
  function notify(message) {
    const el = document.getElementById('remok-toast');
    el.textContent = message; el.hidden = false; clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3500);
  }
  const btn = (text, action, attrs = '', primary = false) => `<button type="button" data-action="${action}" ${attrs} class="${primary ? 'remok-primary' : ''}">${text}</button>`;
  function input(path, label, type = 'number', placeholder = '', extra = '') {
    const v = get(path), key = 'field-' + path.replace(/\./g, '-');
    return `<label class="remok-field" for="${key}">${label}<input id="${key}" data-path="${path}" type="${type}" ${type === 'number' ? 'inputmode="numeric" min="0" step="any"' : ''} value="${esc(v)}" placeholder="${esc(placeholder)}" ${extra}></label>`;
  }
  const check = (path, label) => `<label class="remok-check"><input type="checkbox" data-path="${path}" ${get(path) ? 'checked' : ''}>${label}</label>`;
  const select = (path, label, options, blank = false) => `<label class="remok-field">${label}<select data-path="${path}">${blank ? '<option value="">Выберите вариант</option>' : ''}${Object.entries(options).map(([k, v]) => `<option value="${k}" ${String(get(path)) === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>`;
  const textarea = (path, label, placeholder) => `<label class="remok-field">${label}<textarea data-path="${path}" placeholder="${esc(placeholder)}">${esc(get(path))}</textarea></label>`;
  const yesno = (path, title) => `<h3>${title}</h3><div class="remok-toggle">${[true, false].map(v => btn(v ? 'Да' : 'Нет', 'choose', `data-path="${path}" data-value="${v}" aria-pressed="${get(path) === v}"`)).join('')}</div>`;
  const warning = (values, depth = false) => values.some(v => C.positive(v) && (depth ? v < 20 || v > 800 : v < 300 || v > 5000)) ? '<p class="remok-warning">Проверьте размер — значение выглядит необычным.</p>' : '';
  const errors = list => list.length ? `<div class="remok-error">${list.map(esc).join('<br>')}</div>` : '';
  function linesHTML(lines) {
    return lines.map(l => `<div class="remok-row"><div>${esc(l.title)}<small>${esc(l.detail)}${l.area != null ? ' · ' + decimal(l.area) + ' м²' : ''}</small>${l.comment ? '<small>Комментарий: ' + esc(l.comment) + '</small>' : ''}</div><strong>${money(l.price)}</strong></div>`).join('');
  }
  const totalHTML = (label, total) => `<div class="remok-row remok-total"><span>${label}</span><strong>${money(total)}</strong></div>`;
  function summary() {
    const total = state.items.reduce((sum, item) => sum + C.product(item, pricing).total, 0) + (state.balcony.saved ? C.balcony(state.balcony, pricing).total : 0);
    return state.items.length ? `<div class="remok-summary"><span>Изделий: <b>${state.items.length}</b></span><span>Текущая сумма: <b>${money(total)}</b></span></div>` : '';
  }
  function clientHTML() {
    return `<section class="remok-card"><h2>Объект замера</h2><p class="remok-help">Данные клиента необязательны. Можно сразу перейти к расчёту.</p><div class="remok-grid">${input('client.name', 'Клиент', 'text', 'Имя клиента')}${input('client.phone', 'Телефон', 'tel', '', 'autocomplete="tel" inputmode="tel" aria-describedby="remok-phone-help"')}<p id="remok-phone-help" class="remok-help remok-full">Формат: +7 XXX XXX-XX-XX. Введите 10 цифр после +7.</p>${select('client.contactPreference','Предпочтительный способ связи',{phone:'Телефон',whatsapp:'WhatsApp',telegram:'Telegram',max:'MAX'})}${state.client.contactPreference === 'telegram' ? input('client.telegramUsername','Telegram (необязательно)','text','@username') : ''}<div class="remok-full">${input('client.address', 'Адрес объекта', 'text', 'Улица, дом, квартира')}</div></div></section>`;
  }
  function startHTML() {
    const adding = state.chooseProduct || state.items.length || state.balcony.saved;
    const choices = [['glazing', 'Пластиковое остекление', 'Окно ПВХ с возможной отделкой'], ['aluminum', 'Алюминиевое остекление', 'Холодное алюминиевое остекление'], ['balcony-glazing', 'Остекление балкона', 'ПВХ или алюминий · прямое, Г, П'], ['finish', 'Отделка окна', 'Внутренняя и/или наружная отделка существующего окна']];
    choices.push(['balcony', 'Отделка балкона', 'Внутренняя отделка балкона']);
    return `<div class="remok-page-title"><span class="remok-eyebrow">${adding ? 'Следующее изделие' : 'Рабочая страница замерщика'}</span><h1>${adding ? 'Добавить изделие' : 'Новый замер'}</h1><p>От размеров — к готовой смете.</p></div>${adding ? '' : clientHTML()}<section class="remok-card"><h2>Что считаем?</h2><div class="remok-grid">${choices.map(([mode, title, subtitle]) => `<button type="button" class="remok-choice" data-action="${mode === 'balcony' ? 'edit-balcony' : 'start'}" data-mode="${mode}"><strong>${title}</strong><span>${subtitle}</span></button>`).join('')}</div></section>${adding ? btn('Вернуться к замеру', 'back-saved') : ''}`;
  }
  function partReady(key) {
    const d = state.draft, p = d[key];
    return p.enabled === false || p.enabled === true && C.positive(p.depth) && p.type && p.depthChecked && (!p.hasDepthDifference || p.comment.trim());
  }
  function finishHTML(key) {
    const d = state.draft, part = d[key], path = 'draft.' + key, title = key === 'exterior' ? 'Наружная отделка' : 'Внутренняя отделка';
    const price = (key === 'exterior' ? C.calculateExterior : C.calculateInterior)(d.width, d.height, part.depth, part.type, pricing);
    return `<div class="remok-section"><h3>${title}</h3>${input(path + '.depth', key === 'exterior' ? 'Глубина наружного откоса, мм' : 'Глубина внутреннего откоса, мм')}${warning([part.depth], true)}${check(path + '.depthChecked', 'Я проверил глубину откосов по всем сторонам')}<p class="remok-help">Подтвердите, что глубина откоса проверена и существенное расхождение размеров не пропущено.</p>${check(path + '.hasDepthDifference', 'Есть расхождение глубины')}${part.hasDepthDifference ? textarea(path + '.comment', 'Комментарий по размерам', 'Слева 180 мм, справа 210 мм, сверху 190 мм') : ''}${select(path + '.type', 'Вариант отделки', L[key], true)}${price !== null ? `<div class="remok-result"><span class="${partReady(key) ? 'remok-success' : 'remok-muted'}">${partReady(key) ? '✓ ' : ''}${title}${partReady(key) ? '' : ' · подтвердите замер'}</span>${linesHTML([{ title: L[key][part.type], detail: 'Глубина откоса: ' + part.depth + ' мм', price }])}</div>` : ''}</div>`;
  }
  function openingField(path,label,aluminum=false) {
    const section=get(path)||{},direction=['turn','tilt_turn'].includes(section.openingType);
    return select(path+'.openingType',label,aluminum?V.aluminumOpenings:S.openings,!aluminum)+(!aluminum&&direction?select(path+'.hingeSide','Петли',{left:'Слева',right:'Справа'},true):'');
  }
  function transomHTML(d) {
    if(d.mode!=='glazing'||!['single','double','triple'].includes(d.productType))return '';
    return `<div class="remok-section">${check('draft.hasTopTransom','Верхняя глухая фрамуга')}${d.hasTopTransom?input('draft.transomHeightMm','Высота верхней фрамуги, мм')+'<p class="remok-help">Нижняя часть: '+esc(Number(d.height)-Number(d.transomHeightMm))+' мм. Верхняя фрамуга — цельная, глухая.</p>':''}</div>`;
  }
  function sketchHTML(item) {
    const sketches=V.sketches(item);
    return sketches.length?sketches.map(s=>`<div class="remok-plane-sketch">${s.title?'<h3>'+esc(s.title)+'</h3>':''}${S.renderWindowSketch(item,{model:s.model})}${s.characteristics.map(t=>'<p class="remok-help">'+esc(t)+'</p>').join('')}</div>`).join(''):'<p class="remok-help">Эскиз появится после ввода размеров.</p>';
  }
  function blockDimensions(d) {
    return select('draft.windowCount','Оконных секций',{1:'Одна',2:'Две'})+'<div class="remok-grid">'+d.windows.map((_,i)=>input('draft.windows.'+i+'.widthMm','Ширина окна '+(i+1)+', мм')).join('')+input('draft.windowHeightMm','Высота окон, мм')+'</div><h3>Дверь</h3><div class="remok-grid">'+input('draft.doorWidthMm','Ширина двери, мм')+input('draft.doorHeightMm','Высота двери, мм')+'</div><p class="remok-help">Площадь конструкции: '+decimal(V.measure(d).area)+' м². Габарит для отделки: '+esc(d.width)+' × '+esc(d.height)+' мм.</p>';
  }

  function planeFinish(path, plane, key) {
    const part=plane[key],base=path+'.'+key,title=key==='exterior'?'Наружная отделка':'Внутренняя отделка';
    return `<div class="remok-section">${check(base+'.enabled',title)}${part.enabled?input(base+'.depth','Глубина, мм')+select(base+'.type','Вариант отделки',L[key],true)+check(base+'.depthChecked','Я проверил глубину откосов по всем сторонам')+check(base+'.hasDepthDifference','Есть расхождение глубины')+(part.hasDepthDifference?textarea(base+'.comment','Комментарий по размерам','Опишите расхождение'):''):''}</div>`;
  }
  function planeEditor(d) {
    const ids=V.planeIds(d);if(!ids.includes(d.activePlaneId))d.activePlaneId=ids[0];
    const index=d.planes.findIndex(p=>p.id===d.activePlaneId),p=d.planes[index],path='draft.planes.'+index;
    const sum=p.sections.reduce((s,p)=>s+(Number(p.widthMm)||0),0),valid=p.sections.every(s=>C.positive(s.widthMm))&&Math.abs(sum-Number(p.widthMm))<.01;
    return `<div class="remok-toggle remok-plane-tabs" role="tablist">${ids.map(id=>btn(V.planeNames[id],'plane-tab',`data-id="${id}" role="tab" aria-selected="${d.activePlaneId===id}"`)).join('')}</div><section class="remok-surface"><h2>${V.planeNames[p.id]}</h2><div class="remok-grid">${input(path+'.widthMm','Ширина плоскости, мм')}${input(path+'.heightMm','Высота плоскости, мм')}</div>${select(path+'.sectionCount','Количество секций',Object.fromEntries(Array.from({length:8},(_,i)=>[i+1,String(i+1)])))}${select(path+'.heightMode','Тип по высоте',{normal:'Обычное',floor:'В пол'})}${p.heightMode==='floor'?`<div class="remok-grid">${input(path+'.upperHeightMm','Высота верхнего яруса, мм')}${input(path+'.lowerHeightMm','Высота нижнего яруса, мм')}</div><p class="${C.positive(p.upperHeightMm)&&C.positive(p.lowerHeightMm)&&Math.abs(Number(p.upperHeightMm)+Number(p.lowerHeightMm)-Number(p.heightMm))<.01?'remok-success':'remok-warning'}">Общая высота: ${esc(p.heightMm)} мм. Сумма ярусов: ${Number(p.upperHeightMm)+Number(p.lowerHeightMm)} мм</p>${select(path+'.lowerFilling','Нижнее заполнение',{glass:'Стекло',sandwich:'Сэндвич-панель'})}<p class="remok-help">Нижний ярус глухой; деления соответствуют верхним секциям.</p>`:''}<h3>Верхние секции</h3><div class="remok-grid">${p.sections.map((_,i)=>`<div>${input(path+'.sections.'+i+'.widthMm','Секция '+(i+1)+', мм')}${openingField(path+'.sections.'+i,'Тип открывания',d.balconyGlazingMaterial==='aluminum')}</div>`).join('')}</div><p class="${valid?'remok-success':'remok-warning'}">Сумма секций: ${decimal(sum)} мм ${valid?'✓':'— не совпадает с общей шириной. Цена рассчитывается по габариту.'}</p>${btn('Разделить ширину поровну','equal-plane',`data-index="${index}"`)}${S.renderWindowSketch({...p,sketchPlane:true})}${planeFinish(path,p,'exterior')}${planeFinish(path,p,'interior')}</section>`;
  }
  function balconyGlazingEditor(d) {
    const r=C.product(d,pricing),pvc=d.balconyGlazingMaterial==='pvc';
    const preview=shape=>`<svg class="remok-shape-preview" viewBox="0 0 100 60" aria-hidden="true"><path d="${shape==='straight'?'M10 40H90':shape==='l'?'M10 10V45H90':'M10 10V45H90V10'}" fill="none" stroke="currentColor" stroke-width="4"/></svg>`;
    return `<section class="remok-card remok-editing"><h1>Остекление балкона</h1>${itemSummary(d,r)}${select('draft.mode','Вид работ',mainTypes)}${input('draft.room','Помещение / название','text')}<h2>Тип конструкции</h2><div class="remok-toggle">${[['pvc','ПВХ'],['aluminum','Алюминий']].map(([k,t])=>btn(t,'balcony-material',`data-material="${k}" aria-pressed="${d.balconyGlazingMaterial===k}"`)).join('')}</div>${d.balconyGlazingMaterial?`<h2>Форма остекления</h2><div class="remok-type-grid">${Object.entries(V.shapes).map(([k,t])=>`<button type="button" class="remok-choice" data-action="balcony-shape" data-shape="${k}" aria-pressed="${d.balconyGlazingShape===k}">${preview(k)}<strong>${t}</strong></button>`).join('')}</div>${d.balconyGlazingShape==='l'?select('draft.sidePosition','Боковая сторона',{left:'Слева',right:'Справа'}):''}${d.balconyGlazingShape?`${pvc?select('draft.profile','Профиль',R.profiles.options(d,pricing),true)+select('draft.lamination','Ламинация',L.lamination):select('draft.aluminumColor','Цвет алюминия',L.aluminumColors)}${input('draft.hardware','Фурнитура','text',pricing.hardwareDefault)}${planeEditor(d)}`:''}`:''}<p>Общая площадь: ${decimal(r.area)} м²; стекло: ${decimal(r.glassArea)} м²; сэндвич: ${decimal(r.sandwichArea)} м²</p>${linesHTML(r.lines)}${errors([...new Set(r.errors)])}${worksHTML('draft.additionalWorks','Дополнительные работы изделия')}${totalHTML('Итого по изделию',r.total)}<div class="remok-actions">${btn('Сохранить изделие','save-product',r.errors.length?'disabled':'',true)}${btn('Отменить','cancel-product')}</div></section>`;
  }
  function initializeBalcony(d) {
    d.balconyGlazingMaterial=d.balconyGlazingMaterial||'';d.balconyGlazingShape=d.balconyGlazingShape||'';d.sidePosition=d.sidePosition||'right';
    d.planes=d.planes||['left','facade','right'].map(id=>{const p=V.newPlane(id);V.equalPlane(p);return p;});d.hardware=d.hardware||pricing.hardwareDefault;
  }
  function initializeBlock(d) {
    d.geometryVersion=2;
    for(const key of ['windowHeightMm','doorWidthMm','doorHeightMm'])if(d[key]===undefined)d[key]='';
    d.windows ||= V.blockWindows(d).map(w=>({...w,widthMm:w.widthMm??''}));
    d.windowCount=String(d.windows.length);d.doorPosition=V.doorPosition(d);
    d.sections ||= [{openingType:'fixed',hingeSide:'left'},{openingType:'turn',hingeSide:'left'}];
  }
  function aluminumEditor(d) {
    if(!d.sections)return '<p class="remok-help">Конфигурация старого алюминиевого изделия не указана.</p>'+btn('Задать секции','aluminum-sections');
    return `<div class="remok-section"><h3>Алюминиевые секции</h3>${select('draft.sectionCount','Количество секций',Object.fromEntries(Array.from({length:8},(_,i)=>[i+1,String(i+1)])))}<div class="remok-grid">${d.sections.map((_,i)=>`<div>${input('draft.sections.'+i+'.widthMm','Секция '+(i+1)+', мм')}${select('draft.sections.'+i+'.openingType','Тип открывания',V.aluminumOpenings)}</div>`).join('')}</div>${btn('Разделить ширину поровну','aluminum-sections')}${sketchHTML(d)}</div>`;
  }

  function productDescription(item) {
    if (item.mode === 'finish') return '';
    return `<h3>${esc(item.mode === 'balcony-glazing' ? 'Остекление балкона' : item.mode === 'aluminum' ? 'Алюминиевое остекление' : S.types[item.productType]?.label || 'Тип изделия не указан')}</h3>${sketchHTML(item)}<div class="remok-characteristics">${V.characteristics(item, pricing.hardwareDefault).map(text => `<p>${esc(text)}</p>`).join('')}</div>`;
  }
  function productLines(item) {
    return C.product(item, pricing).lines.map(l => l.kind ? l : ({...l, comment:'',detail:item.mode === 'balcony-glazing' ? l.detail.replace(/ · Глубина:.*$/, '') : l.title === 'Внутренняя отделка' ? L.interior[item.interior.type] : l.title === 'Наружная отделка' ? L.exterior[item.exterior.type] : l.detail}));
  }
  function typeChoices(d) {
    return `<div class="remok-section"><h2>Тип изделия</h2><div class="remok-type-grid">${Object.entries(S.types).map(([key, type]) => `<button type="button" class="remok-choice" data-action="product-type" data-type="${key}" aria-pressed="${d.productType === key}">${S.renderWindowSketch({ productType: key, width: type.balcony ? 2000 : type.count * 700, height: type.balcony ? 2200 : 1450 }, { preview: true })}<strong>${esc(type.label)}</strong></button>`).join('')}</div></div>`;
  }
  function sectionEditor(d) {
    const type = S.types[d.productType]; if (!type) return '';
    if (V.modernBlock(d)) return select('draft.doorPosition','Положение двери',{left:'Дверь слева',...(d.windows.length===2?{middle:'Дверь между окнами'}:{}),right:'Дверь справа'}) + d.windows.map((_,i)=>openingField('draft.windows.'+i,'Открывание окна '+(i+1))).join('') + openingField('draft.sections.1','Открывание двери') + sketchHTML(d);
    const data = S.sectionData(d);
    return `<div class="remok-section"><h3>Секции и открывание</h3>${type.balcony ? select('draft.doorSide', 'Положение двери', { right: 'Дверь справа', left: 'Дверь слева' }) : ''}<div class="remok-grid">${data.sections.map((_, i) => `<div class="remok-surface">${input('draft.sections.' + i + '.widthMm', type.balcony ? (i === 0 ? 'Ширина оконной части, мм' : 'Ширина двери, мм') : 'Ширина секции ' + (i + 1) + ', мм')}${openingField('draft.sections.' + i, 'Тип открывания')}</div>`).join('')}</div><p class="${data.valid ? 'remok-success' : 'remok-warning'}">Сумма секций: ${decimal(data.sum)} мм · ${data.valid ? 'соответствует общей ширине' : 'не соответствует общей ширине; расчёт цены доступен'}</p>${btn('Разделить ширину поровну', 'equal-sections')}${S.renderWindowSketch(d)}</div>`;
  }
  function editorHTML() {
    const d = state.draft;
    if (!d) { state.step = 'start'; return startHTML(); }
    if (d.mode === 'balcony-glazing') { initializeBalcony(d); return balconyGlazingEditor(d); }
    if(V.modernBlock(d) && !d.windows) initializeBlock(d);
    const dimensionsReady = C.area(d.width, d.height) !== null && (!V.modernBlock(d) || !V.measure(d).errors.length), r = C.product(d, pricing);
    let html = `<section class="remok-card remok-editing"><span class="remok-eyebrow">${L.types[d.mode]}</span><h1>Изделие №${d.number}</h1>${select('draft.mode', 'Вид работ', mainTypes)}${input('draft.room', 'Помещение / название', 'text', 'Например: кухня')}${itemSummary(d,r)}${d.mode === 'glazing' ? typeChoices(d) : ''}${V.modernBlock(d) ? blockDimensions(d) : `<div class="remok-grid">${input('draft.width', 'Ширина, мм')}${input('draft.height', 'Высота, мм')}</div>${warning([d.width,d.height])}`}`;
    if (d.mode === 'glazing') {
      if (S.types[d.productType]) {
        if (!Array.isArray(d.sections) || d.sections.length !== S.types[d.productType].count) {
          d.sections = S.sectionData(d).sections.map(p => ({ ...p, widthMm: p.widthMm ?? '', openingType: p.openingType || '' }));
        }
        html += transomHTML(d) + sectionEditor(d);
      } else html += d.productType === '' ? '<p class="remok-help">Выберите тип изделия выше.</p>' : '<p class="remok-help">Тип изделия не указан. Для старого замера конфигурация не предполагается автоматически.</p>';
      html += input('draft.hardware', 'Фурнитура', 'text', pricing.hardwareDefault);
    }
    if (d.mode === 'aluminum') html += input('draft.hardware', 'Фурнитура', 'text', pricing.hardwareDefault) + aluminumEditor(d);
    if (dimensionsReady) {
      if (d.mode === 'glazing' || d.mode === 'aluminum') {
        const price = d.mode === 'aluminum' ? C.calculateAluminum(d.width, d.height, d.aluminumColor || 'white', pricing) : C.calculateGlazing(V.measure(d).area * 1e6, 1, d.profile, R.profiles.forItem(d,pricing), d.lamination || 'none');
        if (d.mode === 'aluminum') html += select('draft.aluminumColor', 'Цвет алюминия', L.aluminumColors);
        else {
          html += select('draft.profile', 'Профиль', R.profiles.options(d,pricing), true);
          if (d.profile) html += select('draft.lamination', 'Ламинация', L.lamination);
        }
        if (price !== null) html += `<div class="remok-result"><span class="remok-success">✓ Остекление</span>${linesHTML([{ title: d.mode==='aluminum'?C.glazingDetail(d):R.profiles.name(d,pricing) + (d.lamination&&d.lamination!=='none'?' · '+L.lamination[d.lamination]:''), detail: `${d.width} × ${d.height} мм · Площадь: ${decimal(V.measure(d).area)} м²`, price }])}</div><div class="remok-section">${yesno('draft.exterior.enabled', 'Нужна наружная отделка?')}</div>`;
        if (price !== null && d.exterior.enabled) html += finishHTML('exterior');
        if (price !== null && partReady('exterior')) {
          html += `<div class="remok-section">${yesno('draft.interior.enabled', 'Нужна внутренняя отделка?')}</div>`;
          if (d.interior.enabled) html += finishHTML('interior');
        }
      } else {
        html += `<div class="remok-section"><h3>Какая отделка нужна?</h3><div class="remok-toggle">${[['interior', 'Внутренняя'], ['exterior', 'Наружная'], ['both', 'Внутренняя + наружная']].map(([k, label]) => btn(label, 'finish-kind', `data-kind="${k}" aria-pressed="${d.finishKind === k}"`)).join('')}</div></div>`;
        if (d.exterior.enabled) html += finishHTML('exterior');
        if (d.interior.enabled && (!d.exterior.enabled || partReady('exterior'))) html += finishHTML('interior');
      }
    }
    html += worksHTML('draft.additionalWorks','Дополнительные работы изделия');
    html += `<div class="remok-section">${r.lines.length ? totalHTML(r.errors.length ? 'Промежуточный итог' : 'Итого по изделию', r.total) : ''}${r.errors.length ? '<p class="remok-help">' + esc(r.errors[0]) + '</p>' : '<p class="remok-success">✓ Все необходимые данные заполнены</p>'}<div class="remok-actions">${btn('Сохранить изделие', 'save-product', r.errors.length || (d.mode === 'glazing' && d.productType === '') ? 'disabled' : '', true)}${btn('Отменить', 'cancel-product')}</div></div></section>`;
    return html;
  }
  function productCard(item) {
    const r = C.product(item, pricing);
    return `<section class="remok-card remok-product-card" id="product-${item.id}"><h2>Изделие №${item.number}${item.room ? ' · ' + esc(item.room) : ''}</h2><p class="remok-muted">${esc(L.types[item.mode])}${item.mode === 'finish' ? ' · '+esc(item.width)+' × '+esc(item.height)+' мм' : ''}</p>${productDescription(item)}${linesHTML(productLines(item))}${r.additionalWorksTotal?totalHTML('Основная стоимость',r.baseTotal)+totalHTML('Доп. работы изделия',r.additionalWorksTotal):''}${totalHTML('Итого по изделию', r.total)}<div class="remok-actions">${btn('Изменить', 'edit-product', `data-id="${item.id}"`)}${btn('Копировать', 'duplicate', `data-id="${item.id}"`)}${btn('Удалить', 'delete-product', `data-id="${item.id}"`)}</div></section>`;
  }
  function savedHTML() {
    return `<div class="remok-page-title"><span class="remok-success">✓ Изделие сохранено</span><h1>Изделия замера</h1></div>${state.items.map(productCard).join('')}${state.balcony.saved?balconyCard():''}<section class="remok-card"><div class="remok-actions">${btn('+ Добавить изделие', 'add-product')}${btn('Перейти к смете', 'continue', '', true)}</div></section>`;
  }
  function floorDimensions(path) {
    return `<div class="remok-grid">${input(path + '.length', 'Длина, мм')}${input(path + '.width', 'Ширина, мм')}</div>${warning([get(path + '.length'), get(path + '.width')])}`;
  }
  function balconyHTML() {
    const b = state.balcony, r = C.balcony(b, pricing);
    let html = `<section class="remok-card remok-editing"><span class="remok-eyebrow">Отдельный расчёт</span><h1>Отделка балкона</h1><h3>Что отделываем?</h3><div class="remok-grid">${Object.entries(L.sections).map(([k, v]) => check('balcony.' + k + '.enabled', v)).join('')}</div>`;
    if (b.walls.enabled) {
      html += `<div class="remok-section"><h2>Стены</h2>${select('balcony.walls.material', 'Материал всех стен', L.walls)}${check('balcony.walls.insulated', 'С утеплением')}`;
      html += b.walls.items.map((w, i) => {
        const path = 'balcony.walls.items.' + i, wr = C.calculateWall(w, b.walls.material, b.walls.insulated, pricing);
        return `<div class="remok-surface"><h3>Стена №${i + 1}</h3><div class="remok-grid">${input(path + '.width', 'Ширина, мм')}${input(path + '.height', 'Высота, мм')}</div>${warning([w.width, w.height])}${yesno(path + '.hasOpenings', 'Есть проёмы?')}${w.hasOpenings ? w.openings.map((o, j) => `<div class="remok-opening"><h3>Проём №${j + 1}</h3><div class="remok-grid">${input(path + '.openings.' + j + '.width', 'Ширина проёма, мм')}${input(path + '.openings.' + j + '.height', 'Высота проёма, мм')}</div>${btn('Удалить проём', 'delete-opening', `data-wall="${i}" data-opening="${j}"`)}</div>`).join('') + btn('+ Добавить проём', 'add-opening', `data-wall="${i}"`) : ''}${wr.error ? errors([wr.error]) : `<div class="remok-result"><div>Площадь стены: ${decimal(wr.gross)} м²</div><div>Проёмы: ${decimal(wr.openings)} м²</div><strong>Площадь отделки: ${decimal(wr.net)} м²</strong>${totalHTML('Стоимость стены', wr.price)}</div>`}${btn('Удалить стену', 'delete-wall', `data-wall="${i}"`)}</div>`;
      }).join('');
      html += btn('+ Добавить стену', 'add-wall') + '</div>';
    }
    if (b.floor.enabled || b.warmFloor.enabled) {
      html += `<div class="remok-section"><h2>Пол</h2>${!b.floor.enabled ? '<p class="remok-help">Для расчета тёплого пола укажите размеры пола. Отделка пола не включена в смету.</p>' : ''}${floorDimensions('balcony.floor')}${b.floor.enabled ? select('balcony.floor.material', 'Материал пола', L.floor) + check('balcony.floor.insulated', 'С утеплением') : ''}</div>`;
    }
    if (b.ceiling.enabled) html += `<div class="remok-section"><h2>Потолок</h2>${floorDimensions('balcony.ceiling')}${select('balcony.ceiling.material', 'Материал потолка', L.walls)}${check('balcony.ceiling.insulated', 'С утеплением')}</div>`;
    if (b.electricity.enabled) html += `<div class="remok-section"><h2>Электрика</h2>${check('balcony.electricity.base', 'Завести электрику')}${check('balcony.electricity.addPoints', 'Добавить электроточки')}${b.electricity.addPoints ? input('balcony.electricity.points', 'Количество точек') : ''}</div>`;
    html += worksHTML('balcony.additionalWorks','Дополнительные работы изделия');
    html += `<div class="remok-section"><h2>Итог балкона</h2>${linesHTML(r.lines)}${errors(r.errors)}${totalHTML(r.errors.length ? 'Промежуточный итог' : 'Итого балкон', r.total)}<div class="remok-actions">${btn('Сохранить изделие', 'save-balcony', r.errors.length ? 'disabled' : '', true)}${btn('Без отделки балкона', 'skip-balcony')}</div></div></section>`;
    return html;
  }
  function balconyCard() {
    const r = C.balcony(state.balcony, pricing);
    return `<section class="remok-card"><h2>Отделка балкона</h2>${linesHTML(r.lines)}${totalHTML('Итого балкон', r.total)}${btn('Изменить', 'edit-balcony')}</section>`;
  }
  const workPrice = V.workPrice, workValid = V.workValid;
  function worksHTML(path,title) {
    const works=get(path)||[], list='work-names-'+path.replaceAll('.','-');
    return '<section class="remok-section remok-works"><h3>'+esc(title)+'</h3><datalist id="'+list+'">'+['Демонтаж','Доставка','Подъём','Вывоз мусора','Герметизация','СТИЗ','Работа с лесов','Другая работа'].map(n=>'<option value="'+n+'"></option>').join('')+'</datalist>'+works.map((w,i)=>{
      const p=path+'.'+i;
      return '<div class="remok-surface" id="work-'+esc(w.id||p)+'">'+input(p+'.name','Название','text','Выберите или введите название','list="'+list+'"')+check(p+'.flat','Указать только общую стоимость')+(w.flat?input(p+'.amount','Сумма, ₽'):'<div class="remok-grid">'+input(p+'.quantity','Количество')+input(p+'.rate','Стоимость за единицу, ₽')+'</div>')+textarea(p+'.comment','Комментарий','Необязательно')+(workValid(w)?totalHTML('Итого за работу',workPrice(w)):errors(['Укажите название и корректную стоимость.']))+btn('Удалить работу','delete-work','data-scope="'+path+'" data-work="'+i+'"')+'</div>';
    }).join('')+btn('+ Добавить работу','add-work','data-scope="'+path+'"')+'</section>';
  }
  function itemSummary(d,r) {
    return '<div class="remok-item-summary"><span>'+esc(d.room||L.types[d.mode])+' · '+esc(d.width||'—')+' × '+esc(d.height||'—')+' мм</span><strong>'+money(r.total)+'</strong></div>';
  }

  function subtotal() { return state.items.reduce((s, i) => s + C.product(i, pricing).total, 0) + (state.balcony.saved ? C.balcony(state.balcony, pricing).total : 0) + state.works.reduce((s, w) => s + (workValid(w) ? workPrice(w) : 0), 0); }
  function priceSignature() {
    // Compare composition as well as cost: equal-price replacements also need review.
    const b = clone(state.balcony); delete b.saved;
    // A compatibility snapshot is not a change in estimate composition.
    const items=state.items.map(item=>{const copy=clone(item);delete copy.profileSnapshot;return copy;});
    return JSON.stringify({ items, balcony: b, works: state.works,
      prices: state.items.map(i => C.product(i, pricing).total), balconyPrice: C.balcony(b, pricing).total });
  }
  function checkFixedPrice() {
    if (state.discountMode === 'target' && state.targetSignature !== priceSignature()) state.targetStale = true;
  }
  function totals() {
    const sub = subtotal(), target = state.discountMode === 'target';
    const targetValid = C.nonnegative(state.targetPrice) && Number(state.targetPrice) <= sub;
    const percentValid = C.nonnegative(state.discount) && Number(state.discount) <= 100;
    const valid = target ? targetValid && !state.targetStale : state.discountMode === 'none' || percentValid;
    const discount = target ? (targetValid && sub > 0 ? (1 - state.targetPrice / sub) * 100 : 0) : state.discountMode === 'percent' && percentValid ? Number(state.discount) : 0;
    const final = target && targetValid ? Number(state.targetPrice) : sub * (1 - discount / 100);
    const invalid = !valid || state.works.some(w => !workValid(w)) || state.items.some(i => C.product(i, pricing).errors.length) || (state.balcony.enabled && (!state.balcony.saved || C.balcony(state.balcony, pricing).errors.length));
    return { sub, targetValid, percentValid, discount, final, invalid };
  }
  function discountHTML(t) {
    let html = `<section class="remok-card" id="remok-discount"><h2>Скидка</h2><div class="remok-toggle">${[['none', 'Без скидки'], ['percent', 'Скидка в процентах'], ['target', 'Установить итоговую цену']].map(([mode, label]) => btn(label, 'discount-mode', `data-mode="${mode}" aria-pressed="${state.discountMode === mode}"`)).join('')}</div>`;
    if (state.discountMode === 'percent') html += input('discount', 'Скидка, %') + (t.percentValid ? `<p class="remok-help">Итоговая цена: ${money(t.final)}</p>` : errors(['Скидка должна быть от 0 до 100 %.']));
    if (state.discountMode === 'target') {
      html += input('targetPrice', 'Итоговая цена, ₽');
      html += t.targetValid ? `<p class="remok-help">Фактическая скидка: ${decimal(t.discount)} %</p>` : errors(['Укажите итоговую цену от 0 до ' + money(t.sub) + '.']);
      if (state.targetStale) html += errors(['Состав или стоимость сметы изменились. Заново задайте итоговую цену или подтвердите указанную.']) + btn('Подтвердить итоговую цену', 'confirm-target', t.targetValid ? '' : 'disabled');
    }
    return html + '</section>';
  }
  function estimateHTML() {
    const t = totals(), { sub, discount, final, invalid } = t;
    let html = `<div class="remok-page-title"><span class="remok-eyebrow">Редактор замера</span><h1>Проверка замера</h1><p>Проверьте состав работ и скидку, затем сформируйте смету.</p></div><details class="remok-card"><summary>Объект: ${esc(state.client.name || state.client.address || 'данные не указаны')}</summary>${clientHTML()}</details>${state.items.map(productCard).join('')}<div class="remok-actions">${btn('+ Добавить изделие', 'add-product')}</div><br>${state.balcony.saved ? balconyCard() : ''}`;
    html += worksHTML('works','Дополнительные работы по заказу');
    html += `${discountHTML(t)}<section class="remok-card remok-grand"><h2>${invalid ? 'Предварительный итог' : 'Стоимость замера'}</h2><div class="remok-row"><span>Изделия и их работы</span><strong>${money(sub-state.works.reduce((sum,w)=>sum+(workValid(w)?workPrice(w):0),0))}</strong></div><div class="remok-row"><span>Общие работы</span><strong>${money(state.works.reduce((sum,w)=>sum+(workValid(w)?workPrice(w):0),0))}</strong></div><div class="remok-row"><span>Стоимость без скидки</span><strong>${money(sub)}</strong></div><div class="remok-row"><span>Скидка · ${decimal(discount)} %</span><strong>− ${money(sub - final)}</strong></div>${totalHTML('Итого', final)}${invalid ? '<p>Завершите заполнение данных и подтвердите цену для окончательной сметы.</p>' : ''}</section><div class="remok-actions">${btn('Сформировать смету', 'document', invalid ? 'disabled' : '', true)}</div>`;
    return html;
  }
  function documentHTML() {
    const t = totals();
    const rows = lines => lines.map(l => `<div class="remok-document-row"><span>${esc(l.title)}${l.detail ? ' — ' + esc(l.detail) : ''}</span><strong>${money(l.price)}</strong></div>`).join('');
    const products = state.items.map(item => {
      const r = C.product(item, pricing);
      const lines = productLines(item);
      return `<section class="remok-card remok-document-card"><h2>Изделие №${item.number}${item.room ? ' — ' + esc(item.room) : ''}</h2>${item.mode !== 'finish' ? productDescription(item) : `<p>${esc(L.types[item.mode])}${item.mode === 'finish' ? ' · '+esc(item.width)+' × '+esc(item.height)+' мм' : ''}</p>`}${rows(lines)}${totalHTML('Итого по изделию', r.total)}</section>`;
    }).join('');
    const b = C.balcony(state.balcony, pricing);
    const phone = state.client.phone.replace(/\D/g, '').length > 1 ? state.client.phone : 'Не указан';
    return `<article class="remok-document"><h1>Итоговая смета</h1><div class="remok-document-client"><p><b>Клиент:</b> ${esc(state.client.name || 'Не указан')}</p><p><b>Телефон:</b> ${esc(phone)}</p><p><b>Адрес:</b> ${esc(state.client.address || 'Не указан')}</p></div>${products}${state.balcony.saved ? `<section class="remok-card remok-document-card"><h2>Отделка балкона</h2>${rows(b.lines)}${totalHTML('Итого балкон', b.total)}</section>` : ''}${state.works.length ? `<section class="remok-card remok-document-card"><h2>Дополнительные работы по заказу</h2>${rows(state.works.map(w => ({ title: w.name, detail: w.flat ? w.comment : decimal(w.quantity) + ' × ' + money(w.rate) + (w.comment ? ' · ' + w.comment : ''), price: workPrice(w) })))}</section>` : ''}<section class="remok-card remok-document-card remok-document-totals">${rows([{ title: 'Стоимость без скидки', price: t.sub }, { title: 'Скидка · ' + decimal(t.discount) + ' %', price: t.sub - t.final }])}${totalHTML('ИТОГО', t.final)}</section><h2 class="remok-document-actions">Коммерческое предложение</h2><div class="remok-actions remok-document-actions">${btn('Поделиться КП', 'share-pdf', '', true)}${btn('Скачать КП', 'download-pdf')}<button type="button" data-action="print" class="remok-link">Печать</button>${btn('← Вернуться к редактированию', 'return-edit')}</div><div class="remok-actions"><p id="remok-pdf-status" class="remok-help" role="status" aria-live="polite"></p></div></article>`;
  }
  function estimatePdfData() {
    if (state.step !== 'document' || totals().invalid) throw new Error('Estimate is not ready');
    const products = state.items.map(item => {
      const result = C.product(item, pricing);
      return {
        title: item.room || 'Изделие №' + item.number,
        subtitle: item.mode === 'balcony-glazing' ? 'Остекление балкона' : item.mode === 'glazing' ? S.types[item.productType]?.label || 'Тип изделия не указан' : L.types[item.mode] + ' ' + item.width + ' × ' + item.height + ' мм',
        characteristics: V.characteristics(item, pricing.hardwareDefault),
        sketches: V.sketches(item),
        lines: productLines(item).map(line => ({ label: line.title + (line.detail ? ' — ' + line.detail : ''), price: line.price })), total: result.total
      };
    });
    const balcony = state.balcony.saved ? C.balcony(state.balcony, pricing) : null;
    return { document: { mode: 'commercialProposal', title: 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ', date: new Date().toLocaleDateString('ru-RU') }, company: R.company, client: { name: state.client.name, phone: state.client.phone, address: state.client.address }, products,
      balcony: balcony ? { lines: balcony.lines.map(line => ({ label: line.title + (line.detail ? ' — ' + line.detail : ''), price: line.price })), total: balcony.total } : null,
      works: state.works.map(work => ({ label: work.name + (work.comment ? ' — ' + work.comment : ''), price: workPrice(work) })),
      totals: { sub: totals().sub, final: totals().final }
    };
  }
  let pdfBusy = false, pdfWarmup;
  function pdfStatus(message) {
    const el = document.getElementById('remok-pdf-status');
    if (el) el.textContent = message;
    else notify(message);
  }
  function pdfButtons(action, busy) {
    pdfBusy = busy;
    for (const key of ['share-pdf', 'download-pdf']) {
      const el = root.querySelector('[data-action="' + key + '"]');
      if (el) { el.disabled = busy; el.textContent = busy && action === key ? 'Создаём PDF...' : key === 'share-pdf' ? 'Поделиться КП' : 'Скачать КП'; }
    }
  }
  function handlePdf(action) {
    if (pdfBusy || totals().invalid) return;
    pdfButtons(action, true);
    let result;
    const fallbackMessage = 'PDF создан. Сохраните файл и отправьте его через нужное приложение.';
    try {
      // Synchronous, embedded resources: no fetch/await consumes the click gesture.
      result = R.pdf.generateEstimatePdf(estimatePdfData());
    } catch (_) {
      pdfStatus('Не удалось создать PDF. Попробуйте ещё раз или используйте печать.');
      pdfButtons(action, false); return;
    }
    function deliver(allowPopup) {
      try { R.pdf.deliver(result, { allowPopup, message: action === 'share-pdf' ? fallbackMessage : 'PDF создан.' }); }
      catch (_) { pdfStatus('PDF создан, но не удалось открыть файл. Нажмите «Скачать КП» ещё раз или используйте печать.'); }
    }
    if (action === 'share-pdf') {
      let file, canShare = false;
      try {
        file = new File([result.blob], result.fileName, { type: 'application/pdf' });
        canShare = typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
      } catch (_) { /* File sharing is optional; PDF download still works. */ }
      if (canShare) {
        try {
          const share = navigator.share({ files: [file], title: 'Коммерческое предложение REMOK' });
          const button = root.querySelector('[data-action="share-pdf"]');
          if (button) button.textContent = 'Поделиться КП';
          Promise.resolve(share).then(() => pdfStatus('PDF передан в выбранное приложение.'), error => {
            if (error?.name === 'AbortError') pdfStatus('Отправка отменена. PDF можно скачать.');
            else deliver(false); // Never open a popup after awaiting the system sheet.
          }).finally(() => pdfButtons(action, false));
          return;
        } catch (error) {
          if (error?.name === 'AbortError') { pdfStatus('Отправка отменена. PDF можно скачать.'); pdfButtons(action, false); return; }
        }
      }
    }
    deliver(true); pdfButtons(action, false);
  }
  function nodeKey(node) {
    if (node.nodeType !== 1) return '#' + node.nodeType;
    const field = node.matches('label') ? node.querySelector('[data-path]')?.dataset.path : '';
    return node.tagName + ':' + (node.id || node.dataset.path || field || node.dataset.action || node.className || '');
  }
  function patchChildren(parent, desired) {
    // Reconcile in place. Unchanged fields (including number inputs) retain their
    // exact DOM identity, native editing buffer, focus and caret on every keystroke.
    let cursor = parent.firstChild;
    for (const next of [...desired.childNodes]) {
      let current = cursor;
      while (current && nodeKey(current) !== nodeKey(next)) current = current.nextSibling;
      if (!current) { parent.insertBefore(next.cloneNode(true), cursor); continue; }
      if (current !== cursor) parent.insertBefore(current, cursor);
      if (current.nodeType === 3) {
        if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
      } else if (current.nodeType === 1) {
        const active = current === document.activeElement;
        for (const attr of [...current.attributes]) {
          if (attr.name === 'open' || (active && attr.name === 'value')) continue;
          if (!next.hasAttribute(attr.name)) current.removeAttribute(attr.name);
        }
        for (const attr of [...next.attributes]) {
          if (active && attr.name === 'value') continue;
          if (current.getAttribute(attr.name) !== attr.value) current.setAttribute(attr.name, attr.value);
        }
        if (current.matches('input,textarea,select')) {
          if (!active && current.value !== next.value) current.value = next.value;
          if (current.type === 'checkbox') current.checked = next.checked;
          if (current.tagName === 'SELECT') patchChildren(current, next);
        } else patchChildren(current, next);
      }
      cursor = current.nextSibling;
    }
    while (cursor) { const next = cursor.nextSibling; cursor.remove(); cursor = next; }
  }
  function render(preserve = false) {
    checkFixedPrice();
    if (state.step === 'document' && totals().invalid) {
      state.step = 'estimate';
      notify('Расчёт изменился. Проверьте данные и заново сформируйте смету.');
    }
    let html;
    if (state.step === 'edit') html = editorHTML();
    else if (state.step === 'saved') html = savedHTML();
    else if (state.step === 'balcony') html = balconyHTML();
    else if (state.step === 'estimate') html = estimateHTML();
    else if (state.step === 'document') html = documentHTML();
    else html = startHTML();
    html = (state.step === 'document' ? '' : summary()) + html;
    root.classList.toggle('remok-document-mode', state.step === 'document');
    if (preserve) {
      const template = document.createElement('template'); template.innerHTML = html;
      patchChildren(main, template.content);
    } else main.innerHTML = html;
    clearTimeout(pdfWarmup);
    if (state.step === 'document') {
      pdfWarmup = setTimeout(() => { try { R.pdf?.generateEstimatePdf(estimatePdfData()); } catch (_) { /* The action itself reports errors and can retry. */ } }, 0);
    } else R.pdf?.releaseLink();
  }
  function go(step) { state.step = step; persist(); render(); main.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
  function openBalcony() { state.balcony.enabled = true; state.balcony.saved = false; go('balcony'); }
  function begin(mode) {
    const part = () => ({ enabled: null, type: '', depth: '', depthChecked: false, hasDepthDifference: false, comment: '' });
    state.draft = { id: id(), number: state.nextNumber, room: '', additionalWorks: [], width: '', height: '', mode, profile: '', lamination: 'none', aluminumColor: 'white', finishKind: '', exterior: part(), interior: part() };
    if (mode === 'glazing') Object.assign(state.draft, { productType: '', sections: [], sectionWidthsAuto: true, doorSide: 'right', hardware: pricing.hardwareDefault });
    if (mode === 'balcony-glazing') initializeBalcony(state.draft);
    if (mode === 'aluminum') { state.draft.hardware = pricing.hardwareDefault; state.draft.sectionCount = '2'; const p={...state.draft,widthMm:state.draft.width}; V.equalPlane(p);state.draft.sections=p.sections;state.draft.sectionWidthsAuto=true; }
    go('edit');
  }
  function fieldChanged(e) {
    const el = e.target, path = el.dataset.path;
    if (!path || el.tagName === 'BUTTON') return;
    if (path === 'client.phone') { el.value = formatPhone(el.value); }
    const value = el.type === 'checkbox' ? el.checked : el.type === 'number' ? (el.value === '' ? '' : Number(el.value)) : el.value;
    // Balcony finish has its own existing state/editor; do not turn the draft into a glazing item of an unknown mode.
    if (path === 'draft.mode' && value === 'balcony') { openBalcony(); return; }
    const previous=get(path);
    set(path, value);
    if(path==='draft.profile') { delete state.draft.profileSnapshot;R.profiles.capture(state.draft,pricing); }
    if(path==='draft.windowCount') {
      const d=state.draft;
      if(value==='2'&&d.windows.length===1)d.windows.push(d.spareWindow||{widthMm:'',openingType:'fixed',hingeSide:'left'});
      if(value==='1'&&d.windows.length===2){d.spareWindow=d.windows.pop();if(d.doorPosition==='middle')d.doorPosition='right';}
      V.sync(d,pricing);
    }
    if (path.startsWith('draft.planes.')) {
      const bits=path.split('.'), p=state.draft.planes[bits[2]];
      if (bits[3] === 'sectionCount' || bits[3] === 'widthMm' && p.sectionWidthsAuto) V.equalPlane(p);
      if (bits[3] === 'sections' && bits[5] === 'widthMm') p.sectionWidthsAuto=false;
      if (['widthMm','heightMm'].includes(bits[3])) {p.exterior.depthChecked=false;p.interior.depthChecked=false;}
      if (bits[4] === 'depth') p[bits[3]].depthChecked=false;
    }
    if (/^draft\.(windowWidthMm|windowHeightMm|doorWidthMm|doorHeightMm|windows\.\d+\.widthMm|windowCount)$/.test(path)) {state.draft.exterior.depthChecked=false;state.draft.interior.depthChecked=false;V.sync(state.draft,pricing);}
    if (state.draft?.mode === 'aluminum' && (path === 'draft.sectionCount' || path === 'draft.width' && state.draft.sectionWidthsAuto)) {const p={...state.draft,widthMm:state.draft.width};V.equalPlane(p);state.draft.sections=p.sections;state.draft.sectionWidthsAuto=true;}
    if (path === 'draft.mode' && value === 'balcony-glazing') initializeBalcony(state.draft);
    if (path === 'draft.width' && state.draft.mode === 'glazing' && !V.modernBlock(state.draft) && state.draft.sectionWidthsAuto) S.equalize(state.draft);
    if (/^draft\.sections\.\d+\.widthMm$/.test(path)) state.draft.sectionWidthsAuto = false;
    if (path === 'draft.mode' && value === 'glazing' && !state.draft.hardware) state.draft.hardware = pricing.hardwareDefault;
    if (path === 'draft.mode') {
      if (['glazing','aluminum'].includes(value) && state.draft.sections) {
        const allowed = value === 'aluminum' ? V.aluminumOpenings : S.openings;
        state.draft.sections.forEach(s => { if (!(s.openingType in allowed)) s.openingType = 'fixed'; });
        if (value === 'aluminum') state.draft.sectionCount = String(state.draft.sections.length);
      }
      if (value !== 'glazing') state.draft.lamination = 'none';
      state.draft.aluminumColor = state.draft.aluminumColor || 'white';
      state.draft.finishKind = state.draft.exterior.enabled && state.draft.interior.enabled ? 'both' : state.draft.exterior.enabled ? 'exterior' : state.draft.interior.enabled ? 'interior' : '';
    }
    if (/^draft\.(width|height)$/.test(path)) { state.draft.exterior.depthChecked = false; state.draft.interior.depthChecked = false; }
    if (/^draft\.(exterior|interior)\.depth$/.test(path)) state.draft[path.split('.')[1]].depthChecked = false;
    if (path === 'targetPrice') { state.targetSignature = priceSignature(); state.targetStale = false; }
    persist(); render(true);
  }
  function formatPhone(value) {
    let digits = String(value || '').replace(/\D/g, '');
    if (String(value).startsWith('+7') || (digits.length === 11 && /^[78]/.test(digits))) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    return '+7' + (digits ? ' ' + digits.slice(0, 3) : '') + (digits.length > 3 ? ' ' + digits.slice(3, 6) : '') + (digits.length > 6 ? '-' + digits.slice(6, 8) : '') + (digits.length > 8 ? '-' + digits.slice(8, 10) : '');
  }
  function editPhone(el, text, deletion = '') {
    const national = el.value.replace(/\D/g, '').slice(1);
    let start = Math.max(0, el.value.slice(0, el.selectionStart).replace(/\D/g, '').length - 1);
    let end = Math.max(0, el.value.slice(0, el.selectionEnd).replace(/\D/g, '').length - 1);
    let digits = String(text || '').replace(/\D/g, '');
    if (digits.length === 11 && /^[78]/.test(digits)) digits = digits.slice(1);
    if (deletion && start === end) {
      if (deletion.includes('Backward')) start = Math.max(0, start - 1);
      else end = Math.min(national.length, end + 1);
    }
    el.value = formatPhone('+7' + (national.slice(0, start) + digits + national.slice(end)).slice(0, 10));
    const digitPosition = Math.min(start + digits.length, 10) + 1;
    let position = 2, count = 0;
    for (let i = 0; i < el.value.length; i++) if (/\d/.test(el.value[i]) && ++count === digitPosition) { position = i + 1; break; }
    // Only the phone mask adjusts selection to account for inserted separators.
    el.setSelectionRange(position, position);
    state.client.phone = el.value; persist(); render(true);
  }
  root.addEventListener('beforeinput', e => {
    if (e.target.dataset.path !== 'client.phone' || !e.cancelable) return;
    if (e.inputType.startsWith('delete') || e.inputType === 'insertText' || e.inputType === 'insertReplacementText') {
      e.preventDefault(); editPhone(e.target, e.data, e.inputType.startsWith('delete') ? e.inputType : '');
    }
  });
  root.addEventListener('paste', e => {
    if (e.target.dataset.path !== 'client.phone') return;
    e.preventDefault(); editPhone(e.target, e.clipboardData.getData('text'));
  });
  root.addEventListener('input', e => { if (!['checkbox'].includes(e.target.type) && e.target.tagName !== 'SELECT') fieldChanged(e); });
  root.addEventListener('change', e => { if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') fieldChanged(e); });
  root.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const action = el.dataset.action;
    if (action === 'share-pdf' || action === 'download-pdf') { handlePdf(action); return; }
    if (action === 'document') { if (!totals().invalid) go('document'); return; }
    if (action === 'return-edit') { go('estimate'); return; }
    if (action === 'print') { if (!totals().invalid) window.print(); return; }
    if (action === 'new') { if (confirm('Начать новый замер? Текущий несохраненный расчет будет очищен.')) { state = fresh(); go('start'); } return; }
    if (action === 'start') { begin(el.dataset.mode); return; }
    if (action === 'balcony-material') {
      state.draft.balconyGlazingMaterial=el.dataset.material;
      state.draft.planes.forEach(p=>p.sections.forEach(s=>{if (!(s.openingType in (el.dataset.material==='aluminum'?V.aluminumOpenings:S.openings)))s.openingType='fixed';}));
    } else if (action === 'balcony-shape') { state.draft.balconyGlazingShape=el.dataset.shape;
    } else if (action === 'plane-tab') { state.draft.activePlaneId=el.dataset.id;
    } else if (action === 'equal-plane') { V.equalPlane(state.draft.planes[Number(el.dataset.index)]);
    } else if (action === 'aluminum-sections') { const d=state.draft,p={...d,sectionCount:d.sectionCount||2,widthMm:d.width};V.equalPlane(p);d.sectionCount=String(p.sectionCount);d.sections=p.sections;d.sectionWidthsAuto=true;
    } else if (action === 'work-preset') { state.works.push({id:id(),name:el.dataset.name,flat:true,quantity:1,rate:'',amount:'',comment:''});
    } else if (action === 'product-type') {
      if (!S.types[el.dataset.type]) return;
      if (state.draft.productType === el.dataset.type) return;
      state.draft.productType = el.dataset.type; state.draft.sections = [];
      state.draft.doorSide = state.draft.doorSide || 'right'; S.equalize(state.draft);
      if (el.dataset.type === 'balcony_small') {initializeBlock(state.draft);V.sync(state.draft,pricing);}
    } else if (action === 'equal-sections') { S.equalize(state.draft);
    } else if (action === 'choose') {
      set(el.dataset.path, el.dataset.value === 'true');
      if (el.dataset.path.endsWith('.hasOpenings') && el.dataset.value === 'true') {
        const w = get(el.dataset.path.replace('.hasOpenings', '')); if (!w.openings.length) w.openings.push({ width: '', height: '' });
      }
    } else if (action === 'finish-kind') {
      state.draft.finishKind = el.dataset.kind;
      state.draft.exterior.enabled = ['exterior', 'both'].includes(el.dataset.kind);
      state.draft.interior.enabled = ['interior', 'both'].includes(el.dataset.kind);
    } else if (action === 'save-product') {
      if (state.draft.mode === 'glazing' && state.draft.productType === '') { notify('Выберите тип изделия.'); return; }
      R.profiles.capture(state.draft,pricing);
      const result = C.product(state.draft, pricing);
      if (result.errors.length) { notify(result.errors[0]); return; }
      const index = state.items.findIndex(i => i.id === state.draft.id);
      if (index < 0) { state.items.push(clone(state.draft)); state.nextNumber = Math.max(state.nextNumber, state.draft.number + 1); }
      else state.items[index] = clone(state.draft);
      state.draft = null; notify('Изделие сохранено'); go(state.returnToEstimate ? 'estimate' : 'saved'); return;
    } else if (action === 'cancel-product') {
      if (!confirm('Отменить изменения этого изделия?')) return;
      state.draft = null; go(state.returnToEstimate ? 'estimate' : state.items.length ? 'saved' : 'start'); return;
    } else if (action === 'add-product') { state.chooseProduct = true; state.returnToEstimate = state.step === 'estimate'; go('start'); return; }
    else if (action === 'back-saved') { go(state.returnToEstimate ? 'estimate' : 'saved'); return; }
    else if (action === 'edit-product' || action === 'duplicate') {
      const item = state.items.find(i => i.id === el.dataset.id); if (!item) return;
      state.returnToEstimate = state.step === 'estimate'; state.draft = clone(item);
      if (V.modernBlock(item)) { initializeBlock(state.draft);state.draft.sections ||= [{openingType:''},{openingType:''}]; }
      if (action === 'duplicate') {
        state.draft.id = id(); state.draft.number = state.nextNumber;
        if(state.draft.additionalWorks)state.draft.additionalWorks.forEach(w=>w.id=id());
        state.draft.exterior.depthChecked = false; state.draft.interior.depthChecked = false;
        notify('Копия открыта. Проверьте размеры и заново подтвердите глубину.');
      }
      go('edit'); return;
    } else if (action === 'delete-product') {
      if (!confirm('Удалить это изделие из сметы?')) return;
      state.items = state.items.filter(i => i.id !== el.dataset.id);
      if (!state.items.length && state.step === 'saved') { go('start'); return; }
    } else if (action === 'continue') { go('estimate'); return; }
    else if (action === 'edit-balcony') { openBalcony(); return; }
    else if (action === 'skip-balcony') {
      if (state.balcony.enabled && !confirm('Не включать отделку балкона в смету? Введённые размеры сохранятся.')) return;
      state.balcony.enabled = false; state.balcony.saved = false; go('estimate'); return;
    } else if (action === 'save-balcony') {
      if (C.balcony(state.balcony, pricing).errors.length) return;
      state.balcony.saved = true; go('saved'); return;
    } else if (action === 'add-wall') state.balcony.walls.items.push(wall());
    else if (action === 'delete-wall') { if (!confirm('Удалить стену и её проёмы?')) return; state.balcony.walls.items.splice(Number(el.dataset.wall), 1); }
    else if (action === 'add-opening') state.balcony.walls.items[el.dataset.wall].openings.push({ width: '', height: '' });
    else if (action === 'delete-opening') state.balcony.walls.items[el.dataset.wall].openings.splice(Number(el.dataset.opening), 1);
    else if (action === 'add-work') {
      const scope=el.dataset.scope||'works';if(!['works','draft.additionalWorks','balcony.additionalWorks'].includes(scope))return;
      if(!get(scope))set(scope,[]);get(scope).push({id:id(),name:'',flat:scope!=='works',quantity:1,rate:'',amount:'',comment:''});
    } else if (action === 'delete-work') {
      const scope=el.dataset.scope||'works';if(!['works','draft.additionalWorks','balcony.additionalWorks'].includes(scope))return;
      if(!confirm('Удалить дополнительную работу?'))return;get(scope).splice(Number(el.dataset.work),1);
    }
    else if (action === 'discount-mode') {
      if (state.discountMode !== el.dataset.mode) {
        state.discountMode = el.dataset.mode;
        if (state.discountMode === 'target') { state.targetPrice = ''; state.targetSignature = null; state.targetStale = false; }
      }
    } else if (action === 'confirm-target' && totals().targetValid) { state.targetSignature = priceSignature(); state.targetStale = false; }
    persist(); render(true);
  });
  window.addEventListener('pageshow', () => { pricing = R.storage.pricing(); persist(); render(true); });
  window.addEventListener('storage', e => { if (e.key === 'remok.estimator.pricing.v1') { pricing = R.storage.pricing(); persist(); render(true); notify('Цены обновлены'); } });
  render(); persist();
})();
  }
})();
