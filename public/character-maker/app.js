/* Vendored from campus-card-activity; same-origin character bridge; printing disabled. */
'use strict';

(() => {
  const assets = window.CAMPUS_ASSETS;
  const catalog = window.CAMPUS_CATALOG;
  const presets = window.CAMPUS_HAIR_PRESETS;
  const $ = (id) => document.getElementById(id);
  const STORE_KEY = 'ktu-character-appearance-v1';
  const hairKeys = ['frontHair', 'rearHair', 'sideHair', 'fullHair'];
  const images = new Map();
  const tintCache = new Map();
  const undoStack = [];
  const colors = [
    { id: 'original', name: '素材原色', color: '#a87555', opacity: 0 },
    { id: 'black', name: '墨黑', color: '#171c28', opacity: .76 },
    { id: 'brown', name: '深棕', color: '#51332c', opacity: .58 },
    { id: 'gold', name: '浅金', color: '#d6b65d', opacity: .58 },
    { id: 'silver', name: '银灰', color: '#c1c7d3', opacity: .73 },
    { id: 'rose', name: '雾玫瑰', color: '#c98e9f', opacity: .62 }
  ];
  const tabs = [
    { id: 'hair', label: '发型', parts: ['hairPreset', 'frontHair', 'rearHair', 'sideHair'] },
    { id: 'eyes', label: '眼睛', parts: ['eyes', 'pupils'] },
    { id: 'brows', label: '眉毛', parts: ['brows'] },
    { id: 'nose', label: '鼻子', parts: ['nose'] },
    { id: 'mouth', label: '嘴型', parts: ['mouth'] },
    { id: 'clothes', label: '服饰', parts: ['clothes', 'glasses'] },
    { id: 'base', label: '性别', parts: ['base'] }
  ];
  const defaultState = () => ({
    version: 1,
    parts: { base: '1776956441', eyes: '1777010404', pupils: null, brows: '1777010874',
      nose: '1777011219', mouth: '1777013141', clothes: '1777146722', glasses: null,
      fullHair: '1777146906', frontHair: null, rearHair: null, sideHair: null },
    adjustments: {}, hairColor: 'original', hairPreset: 'soft-curls',
    name: '', number: '', degree: 'undergraduate'
  });
  let state = defaultState();
  let currentStep = 0;
  let activeTab = 'hair';
  let activePart = 'hairPreset';
  let previewSide = 'front';
  let ready = false;
  let renderQueued = false;
  let toastTimer;
  let saveTimer;
  let sliderSnapshotTaken = false;
  let exportBusy = false;
  let storageAvailable = true;

  const portraitCanvas = $('portrait');
  const avatar = document.createElement('canvas');
  avatar.width = 1611; avatar.height = 1617;
  const avatarContext = avatar.getContext('2d');
  const cardFront = document.createElement('canvas');
  cardFront.width = 2000; cardFront.height = 1266;
  const frontContext = cardFront.getContext('2d');

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function clamp(value, min, max, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  }
  function restoreState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (!saved || saved.version !== 1) return;
      const next = defaultState();
      for (const [key, group] of Object.entries(catalog)) {
        const stored = saved.parts?.[key];
        const value = key === 'base' && stored === '1777054133' ? '1791467405'
          : key === 'frontHair' && stored === '1777036961' ? '1777028017' : stored;
        if (group.items.some(([id]) => value === id) || (group.optional && value === null)) next.parts[key] = value;
      }
      for (const key of [...Object.keys(catalog), 'hair']) {
        const entry = saved.adjustments?.[key];
        if (entry) next.adjustments[key] = {
          x: clamp(entry.x, -80, 80, 0), y: clamp(entry.y, -80, 80, 0),
          scale: clamp(entry.scale, 75, 125, 100), width: clamp(entry.width, 80, 120, 100)
        };
      }
      if (colors.some(c => c.id === saved.hairColor)) next.hairColor = saved.hairColor;
      next.hairPreset = presets.some(p => p.id === saved.hairPreset) ? saved.hairPreset : null;
      if (next.hairPreset === 'long-braids' && next.parts.fullHair === '1777140511' && !next.parts.frontHair) {
        next.parts.frontHair = '1777028017';
      }
      next.name = typeof saved.name === 'string' ? Array.from(saved.name).slice(0, 16).join('') : '';
      next.number = typeof saved.number === 'string' ? saved.number.slice(0, 24) : '';
      next.degree = saved.degree === 'graduate' ? 'graduate' : 'undergraduate';
      state = next;
    } catch { storageAvailable = false; }
  }
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
        $('save-state').textContent = '已保存在本机';
      } catch {
        storageAvailable = false;
        $('save-state').textContent = '当前浏览器无法保存';
      }
    }, 180);
  }
  function remember() {
    undoStack.push({ parts: clone(state.parts), adjustments: clone(state.adjustments), hairColor: state.hairColor, hairPreset: state.hairPreset });
    if (undoStack.length > 35) undoStack.shift();
    $('undo-button').disabled = false;
  }
  function changed() { save(); requestRender(); }
  function notify(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3400);
  }

  function tintedImage(id, colorId) {
    const image = images.get(id);
    if (colorId === 'original') return image;
    const key = `${id}/${colorId}`;
    if (tintCache.has(key)) return tintCache.get(key);
    const color = colors.find(c => c.id === colorId) || colors[0];
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    // Source-atop keeps the supplied alpha, linework and painted shading.
    context.globalCompositeOperation = 'source-atop';
    context.globalAlpha = color.opacity;
    context.fillStyle = color.color;
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (tintCache.size >= 24) tintCache.delete(tintCache.keys().next().value);
    tintCache.set(key, canvas);
    return canvas;
  }
  function drawPart(context, key, model) {
    const id = model.parts[key];
    if (!id) return;
    const item = assets[id];
    if (!item || !images.has(id)) return;
    const adjustment = model.adjustments[key] || { x: 0, y: 0, scale: 100, width: 100 };
    const isHair = hairKeys.includes(key);
    const globalHair = model.adjustments.hair;
    context.save();
    if (isHair && globalHair) {
      context.translate(805.5 + globalHair.x, 600 + globalHair.y);
      context.scale(globalHair.scale / 100 * globalHair.width / 100, globalHair.scale / 100);
      context.translate(-805.5, -600);
    }
    const cx = item.x + item.w / 2, cy = item.y + item.h / 2;
    context.translate(cx + adjustment.x, cy + adjustment.y);
    context.scale(adjustment.scale / 100 * adjustment.width / 100, adjustment.scale / 100);
    context.drawImage(isHair ? tintedImage(id, model.hairColor) : images.get(id), -item.w / 2, -item.h / 2, item.w, item.h);
    context.restore();
  }
  function drawCharacter(context, model) {
    // Back hair sits behind the body; side hair and bangs sit over the uniform.
    for (const key of ['rearHair', 'base', 'nose', 'eyes', 'pupils', 'brows', 'mouth', 'clothes', 'sideHair', 'fullHair', 'frontHair', 'glasses']) drawPart(context, key, model);
  }
  function drawPhoto(context, x, y, width, height) {
    // A 3:4 portrait crop, narrowed symmetrically to fit the supplied card frame.
    const sourceWidth = 1211, sourceHeight = 1617;
    const ratio = Math.max(width / sourceWidth, height / sourceHeight);
    const cropWidth = width / ratio, cropHeight = height / ratio;
    context.drawImage(avatar, 200 + (sourceWidth - cropWidth) / 2, (sourceHeight - cropHeight) / 2,
      cropWidth, cropHeight, x, y, width, height);
  }
  function roundedRect(context, x, y, w, h, radius) {
    context.beginPath(); context.roundRect(x, y, w, h, radius);
  }
  function fitText(context, text, width, maxSize, family, weight = 600) {
    let size = maxSize;
    context.font = `${weight} ${size}px ${family}`;
    const measured = context.measureText(text).width;
    if (measured > width) size = size * width / measured;
    context.font = `${weight} ${size}px ${family}`;
    return size;
  }
  function drawFront() {
    const c = frontContext;
    c.clearRect(0, 0, 2000, 1266);
    c.drawImage(images.get(state.degree === 'graduate' ? 'cardGraduate' : 'cardUndergrad'), 0, 0);
    c.save();
    roundedRect(c, 139, 285, 514, 740, 20);
    c.clip();
    c.fillStyle = '#edf7fd'; c.fillRect(139, 285, 514, 740);
    drawPhoto(c, 139, 285, 514, 740);
    c.restore();
    const chineseFont = '"Microsoft YaHei", "PingFang SC", sans-serif';
    const dataFont = '"Bahnschrift", "Consolas", monospace';
    c.textBaseline = 'alphabetic';
    c.fillStyle = '#20394d';
    const name = state.name.trim();
    fitText(c, name, 1070, 110, chineseFont, 700); c.fillText(name, 782, 469);
    const number = state.number.trim();
    fitText(c, number, 1070, 92, dataFont, 500); c.fillText(number, 784, 720);
  }
  function updateCardPreview() {
    const c = $('card-preview').getContext('2d');
    c.clearRect(0, 0, 1016, 638);
    c.drawImage(previewSide === 'front' ? cardFront : images.get('cardBack'), 0, 0, 1016, 638);
    $('card-preview').setAttribute('aria-label', `校园卡${previewSide === 'front' ? '正面' : '背面'}预览`);
    if ($('preview-dialog').open) updateLargePreview();
  }
  function updateLargePreview() {
    const c = $('large-card-preview').getContext('2d');
    c.clearRect(0, 0, 1016, 638); c.drawImage($('card-preview'), 0, 0);
    $('preview-dialog-title').textContent = `校园卡${previewSide === 'front' ? '正面' : '背面'}`;
  }
  function render() {
    if (!ready) return;
    avatarContext.clearRect(0, 0, avatar.width, avatar.height);
    drawCharacter(avatarContext, state);
    const c = portraitCanvas.getContext('2d');
    c.clearRect(0, 0, 720, 960);
    drawPhoto(c, 0, 0, 720, 960);
    drawFront(); updateCardPreview();
    $('summary-name').textContent = state.name.trim() || '还未填写姓名';
    $('summary-number').textContent = state.number.trim() || '还未填写学号';
    $('summary-degree').textContent = state.degree === 'graduate' ? '研究生' : '本科生';
    $('export-filename').textContent = state.name.trim() && state.number.trim() ? cardFilename() : '姓名+学号.png';
  }
  function requestRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => { renderQueued = false; render(); });
  }

  function partLabel(key) { return key === 'hairPreset' ? '整套发型' : catalog[key].label; }
  function adjustmentKey() { return activePart === 'hairPreset' ? 'hair' : activePart; }
  function applyPreset(model, preset) {
    for (const key of hairKeys) { model.parts[key] = preset[key] || null; delete model.adjustments[key]; }
    delete model.adjustments.hair;
    model.hairPreset = preset.id;
  }
  function presetThumbnail(preset) {
    const model = defaultState(); applyPreset(model, preset);
    const canvas = document.createElement('canvas'); canvas.width = 180; canvas.height = 180;
    const c = canvas.getContext('2d');
    c.scale(.15, .15); c.translate(-205, -30); drawCharacter(c, model);
    return canvas.toDataURL('image/png');
  }
  function makeOption(id, label, src, selected) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'part-option';
    if (['eyes', 'pupils', 'brows', 'nose', 'mouth', 'glasses'].includes(activePart)) button.classList.add('feature-option');
    button.dataset.option = id || ''; button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', label);
    if (src) {
      const img = document.createElement('img'); img.src = src; img.alt = ''; img.draggable = false; button.append(img);
    } else {
      const placeholder = document.createElement('span'); placeholder.className = 'none-icon'; placeholder.textContent = '∅'; placeholder.setAttribute('aria-hidden', 'true'); button.append(placeholder);
    }
    const caption = document.createElement('span'); caption.textContent = label; button.append(caption);
    return button;
  }
  function updateOptions() {
    const grid = $('option-grid'); grid.replaceChildren();
    let count = 0;
    if (activePart === 'hairPreset') {
      for (const preset of presets) grid.append(makeOption(preset.id, preset.label, preset.thumbnail, state.hairPreset === preset.id));
      grid.append(makeOption(null, '无头发', null, hairKeys.every(key => !state.parts[key])));
      count = presets.length + 1;
    } else {
      const group = catalog[activePart];
      if (group.optional) grid.append(makeOption(null, activePart === 'pupils' ? '原始瞳色' : `不加${group.label}`, null, state.parts[activePart] === null));
      for (const [id, label] of group.items) grid.append(makeOption(id, label, assets[id].src, state.parts[activePart] === id));
      count = group.items.length + (group.optional ? 1 : 0);
    }
    grid.classList.toggle('is-large', count > 6);
    grid.setAttribute('aria-label', `选择${partLabel(activePart)}`);
    $('options-count').textContent = `${count} 款`;
    $('hair-colors').hidden = activeTab !== 'hair';
    updateAdjustments();
  }
  function updateAdjustments() {
    const key = adjustmentKey();
    const a = state.adjustments[key] || { x: 0, y: 0, scale: 100, width: 100 };
    $('adjustment-part').textContent = partLabel(activePart);
    const enabled = key === 'hair' ? hairKeys.some(k => state.parts[k]) : Boolean(state.parts[key]);
    for (const field of ['x', 'y', 'scale', 'width']) {
      $(`adjust-${field}`).value = a[field];
      $(`adjust-${field}`).disabled = !enabled;
      $(`value-${field}`).textContent = `${a[field]}${field === 'scale' || field === 'width' ? '%' : ''}`;
    }
    $('reset-adjustment').disabled = !enabled;
  }
  function updateTab() {
    for (const button of $('category-tabs').children) {
      const selected = button.dataset.tab === activeTab;
      button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
    }
    const tab = tabs.find(t => t.id === activeTab);
    $('part-area').setAttribute('aria-labelledby', `tab-${activeTab}`);
    $('subcategories').replaceChildren();
    for (const part of tab.parts) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'subcat-button';
      button.dataset.part = part; button.textContent = partLabel(part);
      button.classList.toggle('is-selected', part === activePart); button.setAttribute('aria-pressed', String(part === activePart));
      $('subcategories').append(button);
    }
    updateOptions();
  }
  function changePart(id) {
    remember();
    if (activePart === 'hairPreset') {
      const preset = presets.find(p => p.id === id);
      if (preset) applyPreset(state, preset);
      else { for (const key of hairKeys) state.parts[key] = null; state.hairPreset = null; }
    } else {
      if (hairKeys.includes(activePart)) {
        if (state.parts.fullHair) {
          state.parts.fullHair = null;
          notify('已切换为组合发型，可以继续搭配前发、后发与侧发。');
        }
        state.hairPreset = null;
      }
      state.parts[activePart] = id || null;
    }
    updateOptions(); changed();
  }
  function syncForm() {
    $('student-name').value = state.name; $('student-number').value = state.number;
    document.querySelector(`input[name="degree"][value="${state.degree}"]`).checked = true;
  }
  function validateIdentity(focus = true) {
    const name = $('student-name').value.trim(), number = $('student-number').value.trim();
    let nameMessage = '', numberMessage = '';
    if (!name) nameMessage = '先为你的角色取一个名字。';
    else if (Array.from(name).length > 16 || /[\u0000-\u001f\u007f]/.test(name)) nameMessage = '姓名需要在 16 个字符以内，不含控制字符。';
    if (!number) numberMessage = '填写一个专属学号，或点击「生成学号」。';
    else if (!/^[A-Za-z0-9-]{1,24}$/.test(number)) numberMessage = '学号请使用 1–24 位字母、数字或短横线。';
    for (const [id, message] of [['name', nameMessage], ['number', numberMessage]]) {
      $(`${id}-error`).textContent = message; $(`${id}-error`).hidden = !message;
      $(`student-${id}`).setAttribute('aria-invalid', String(Boolean(message)));
    }
    if (focus && (nameMessage || numberMessage)) $(nameMessage ? 'student-name' : 'student-number').focus();
    if (nameMessage || numberMessage) return false;
    state.name = name; state.number = number; syncForm(); changed(); return true;
  }
  function goStep(step, shouldFocus = false) {
    if (step === 2 && !validateIdentity(false)) { goStep(1, shouldFocus); validateIdentity(true); return; }
    currentStep = step;
    const panels = ['appearance-panel', 'identity-panel', 'export-panel'];
    panels.forEach((id, i) => { $(id).hidden = i !== step; });
    document.querySelectorAll('[data-step]').forEach(button => {
      const n = Number(button.dataset.step); button.classList.toggle('is-active', n === step); button.classList.toggle('is-complete', n < step);
      if (n === step) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
    if (step === 2) setPreviewSide('front');
    requestRender();
    if (shouldFocus) {
      const heading = $(['appearance-heading', 'identity-heading', 'export-heading'][step]);
      heading.tabIndex = -1; heading.focus({ preventScroll: true });
      if (matchMedia('(max-width:640px)').matches) heading.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }
  function setPreviewSide(side) {
    previewSide = side;
    for (const s of ['front', 'back']) {
      $(`preview-${s}`).classList.toggle('is-selected', s === side);
      $(`preview-${s}`).setAttribute('aria-pressed', String(s === side));
    }
    if (ready) updateCardPreview();
  }
  function randomChoice(array) { return array[Math.floor(Math.random() * array.length)]; }
  function randomize() {
    remember();
    for (const key of ['base', 'eyes', 'brows', 'nose', 'mouth']) state.parts[key] = randomChoice(catalog[key].items)[0];
    state.parts.clothes = state.parts.base === '1791467405' ? '1777146729' : randomChoice(catalog.clothes.items)[0];
    state.parts.glasses = Math.random() > .75 ? catalog.glasses.items[0][0] : null;
    state.parts.pupils = null;
    state.adjustments = {};
    applyPreset(state, randomChoice(presets));
    state.hairColor = randomChoice(colors).id;
    updateOptions(); updateSwatches(); changed();
    notify('新形象准备好了，试试再加一点自己的风格。');
  }
  function updateSwatches() {
    for (const button of $('swatches').children) button.setAttribute('aria-pressed', String(button.dataset.color === state.hairColor));
  }

  // PNG pHYs specifies pixels per metre. 11811 px/m is 300 DPI.
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
    return n >>> 0;
  });
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  async function pngWithDpi(canvas) {
    const blob = await new Promise((resolve, reject) => {
      try { canvas.toBlob(b => b ? resolve(b) : reject(new Error('PNG 编码未完成')), 'image/png'); }
      catch (error) { reject(error); }
    });
    const source = new Uint8Array(await blob.arrayBuffer());
    const chunk = new Uint8Array(21); const view = new DataView(chunk.buffer);
    view.setUint32(0, 9); chunk.set([112, 72, 89, 115], 4);
    view.setUint32(8, 11811); view.setUint32(12, 11811); chunk[16] = 1;
    view.setUint32(17, crc32(chunk.subarray(4, 17)));
    const parts = [source.subarray(0, 8)]; let cursor = 8;
    while (cursor + 12 <= source.length) {
      const length = new DataView(source.buffer, source.byteOffset + cursor, 4).getUint32(0);
      const type = String.fromCharCode(...source.subarray(cursor + 4, cursor + 8));
      const end = cursor + 12 + length;
      if (end > source.length) throw new Error('PNG 数据不完整');
      // Remove browser-specific EXIF, text and significant-bit metadata.
      // Keep color profiles and image data; replace DPI with our own value.
      // Unknown critical chunks remain subject to backend validation.
      if (!(source[cursor + 4] & 32) || ['tRNS', 'sRGB', 'gAMA', 'cHRM', 'iCCP'].includes(type)) {
        parts.push(source.subarray(cursor, end));
      }
      if (type === 'IHDR') parts.push(chunk);
      cursor = end;
    }
    return new Blob(parts, { type: 'image/png' });
  }
  function safeFilename(value) { return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '') || '空天同学'; }
  function cardFilename() { return `${safeFilename(state.name.trim() + state.number.trim())}.png`; }
  // Store already-compressed PNGs in one UTF-8 ZIP: one user download on iOS.
  async function cardZip(files) {
    const encoder = new TextEncoder(), localParts = [], centralParts = [];
    let offset = 0, centralSize = 0;
    for (const file of files) {
      const name = encoder.encode(file.name), bytes = new Uint8Array(await file.blob.arrayBuffer());
      const checksum = crc32(bytes);
      const local = new Uint8Array(30 + name.length), lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x800, true);
      lv.setUint16(12, 33, true); lv.setUint32(14, checksum, true);
      lv.setUint32(18, bytes.length, true); lv.setUint32(22, bytes.length, true); lv.setUint16(26, name.length, true); local.set(name, 30);
      const central = new Uint8Array(46 + name.length), cv = new DataView(central.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x800, true);
      cv.setUint16(14, 33, true); cv.setUint32(16, checksum, true);
      cv.setUint32(20, bytes.length, true); cv.setUint32(24, bytes.length, true); cv.setUint16(28, name.length, true);
      cv.setUint32(42, offset, true); central.set(name, 46);
      localParts.push(local, bytes); centralParts.push(central);
      offset += local.length + bytes.length; centralSize += central.length;
    }
    const end = new Uint8Array(22), ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true); ev.setUint32(16, offset, true);
    return new Blob([...localParts, ...centralParts, end], {type: 'application/zip'});
  }
  let downloadUrls = [];
  let printAccepting = false;
  async function exportCard(upload = false) {
    if (!ready || exportBusy) return;
    if (!validateIdentity()) { goStep(1, true); return; }
    exportBusy = true;
    const buttons = ['download-front', 'print-card'];
    buttons.forEach(id => { $(id).disabled = true; });
    // Freeze editor controls while fonts/PNG encoding finish so name and pixels match.
    const controls = [...document.querySelectorAll('button, input')].filter(el => !el.disabled);
    controls.forEach(el => { el.disabled = true; });
    try {
      await document.fonts.ready; render();
      const canvas = document.createElement('canvas');
      canvas.width = 1016; canvas.height = 638;
      const c = canvas.getContext('2d', { colorSpace: 'srgb' }); c.fillStyle = '#edf7fd'; c.fillRect(0, 0, canvas.width, canvas.height);
      c.drawImage(cardFront, 0, 0, canvas.width, canvas.height);
      const filename = cardFilename();
      const blob = await pngWithDpi(canvas);
      if (upload) return;
      {
        c.clearRect(0, 0, canvas.width, canvas.height);
        c.drawImage(images.get('cardBack'), 0, 0, canvas.width, canvas.height);
        const backBlob = await pngWithDpi(canvas);
        const backFilename = filename.replace(/\.png$/, '_背面.png');
        const archive = await cardZip([{name:filename, blob}, {name:backFilename, blob:backBlob}]);
        downloadUrls.forEach(url => URL.revokeObjectURL(url));
        downloadUrls = [URL.createObjectURL(blob), URL.createObjectURL(backBlob), URL.createObjectURL(archive)];
        const links = [$('download-front-again'), $('download-back-again')];
        links.forEach((link, index) => {
          link.href = downloadUrls[index]; link.download = index ? backFilename : filename;
        });
        $('download-fallback').hidden = false;
        const archiveLink = $('download-zip-again');
        archiveLink.href = downloadUrls[2]; archiveLink.download = filename.replace(/\.png$/, '_正反面.zip');
        archiveLink.click();
        notify('已发起正反面压缩包下载，解压后可获得两张 PNG。');
      }
    } catch (error) {
      const text = error.name === 'TimeoutError' ? '提交超时，请重试；同名重试只会保留一张图片。' : error.message || '操作失败，请重试。';
      if (upload) $('print-status').textContent = text;
      notify(text);
    } finally {
      exportBusy = false; controls.forEach(el => { el.disabled = false; });
      $('download-front').disabled = false; $('print-card').disabled = !printAccepting;
    }
  }

  function bindEvents() {
    $('category-tabs').addEventListener('click', event => {
      const button = event.target.closest('[data-tab]'); if (!button) return;
      activeTab = button.dataset.tab; activePart = tabs.find(t => t.id === activeTab).parts[0]; updateTab();
    });
    $('category-tabs').addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = tabs.findIndex(t => t.id === activeTab);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      activeTab = tabs[next].id; activePart = tabs[next].parts[0]; updateTab(); $(`tab-${activeTab}`).focus();
    });
    $('subcategories').addEventListener('click', event => {
      const button = event.target.closest('[data-part]'); if (!button) return;
      activePart = button.dataset.part; updateTab();
    });
    $('option-grid').addEventListener('click', event => {
      const button = event.target.closest('[data-option]'); if (button && ready) changePart(button.dataset.option);
    });
    $('swatches').addEventListener('click', event => {
      const button = event.target.closest('[data-color]'); if (!button) return;
      remember(); state.hairColor = button.dataset.color; updateSwatches(); changed();
    });
    for (const field of ['x', 'y', 'scale', 'width']) {
      const input = $(`adjust-${field}`);
      input.addEventListener('input', () => {
        if (!sliderSnapshotTaken) { remember(); sliderSnapshotTaken = true; }
        const key = adjustmentKey();
        state.adjustments[key] ??= { x: 0, y: 0, scale: 100, width: 100 };
        state.adjustments[key][field] = Number(input.value);
        $(`value-${field}`).textContent = `${input.value}${field === 'scale' || field === 'width' ? '%' : ''}`;
        changed();
      });
      input.addEventListener('change', () => { sliderSnapshotTaken = false; });
      input.addEventListener('blur', () => { sliderSnapshotTaken = false; });
    }
    $('reset-adjustment').addEventListener('click', () => { remember(); delete state.adjustments[adjustmentKey()]; updateAdjustments(); changed(); });
    $('random-button').addEventListener('click', randomize);
    $('undo-button').addEventListener('click', () => {
      const previous = undoStack.pop(); if (!previous) return;
      Object.assign(state, previous); $('undo-button').disabled = undoStack.length === 0; updateOptions(); updateSwatches(); changed();
    });
    document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => goStep(Number(button.dataset.step), true)));
    $('next-identity').addEventListener('click', () => goStep(1, true));
    $('back-appearance').addEventListener('click', () => goStep(0, true));
    $('back-identity').addEventListener('click', () => goStep(1, true));
    $('identity-form').addEventListener('submit', event => { event.preventDefault(); if (validateIdentity()) goStep(2, true); });
    for (const [id, key] of [['student-name', 'name'], ['student-number', 'number']]) {
      $(id).addEventListener('input', () => {
        state[key] = $(id).value;
        $(`${key}-error`).hidden = true; $(id).setAttribute('aria-invalid', 'false'); changed();
      });
    }
    document.querySelectorAll('input[name="degree"]').forEach(input => input.addEventListener('change', () => { state.degree = input.value; changed(); }));
    $('generate-number').addEventListener('click', () => {
      const buffer = new Uint32Array(1); crypto.getRandomValues(buffer);
      state.number = `${state.degree === 'graduate' ? 'G' : ''}${new Date().getFullYear()}${String(buffer[0] % 1000000).padStart(6, '0')}`;
      $('student-number').value = state.number; $('number-error').hidden = true; $('student-number').setAttribute('aria-invalid', 'false'); changed();
      notify('学号已生成，也可以继续编辑。');
    });
    $('preview-front').addEventListener('click', () => setPreviewSide('front'));
    $('preview-back').addEventListener('click', () => setPreviewSide('back'));
    $('enlarge-card').addEventListener('click', () => { if (ready) { updateLargePreview(); $('preview-dialog').showModal(); } });
    $('close-preview').addEventListener('click', () => $('preview-dialog').close());
    $('download-front').addEventListener('click', () => exportCard(false));
    $('print-card').addEventListener('click', () => exportCard(true));
    $('reset-button').addEventListener('click', () => $('reset-dialog').showModal());
    $('reset-dialog').addEventListener('close', () => {
      if ($('reset-dialog').returnValue !== 'reset') return;
      state = defaultState(); undoStack.length = 0; $('undo-button').disabled = true;
      syncForm(); updateOptions(); updateSwatches();
      for (const key of ['name', 'number']) { $(`${key}-error`).hidden = true; $(`student-${key}`).setAttribute('aria-invalid', 'false'); }
      goStep(0, true); setPreviewSide('front'); changed(); notify('已重新开始制作。');
    });
    window.addEventListener('pagehide', () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {} });
  }

  async function init() {
    restoreState();
    $('university-seal').src = assets.seal.src; $('summary-seal').src = assets.seal.src; $('campus-art').src = assets.cardBack.src; $('favicon').href = assets.seal.src;
    $('undo-button').disabled = true; $('random-button').disabled = true;
    $('part-count').textContent = `${Object.values(catalog).reduce((total, group) => total + group.items.length, 0)} 份原画部件`;
    for (const tab of tabs) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'category-tab';
      button.id = `tab-${tab.id}`; button.dataset.tab = tab.id; button.textContent = tab.label;
      button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', 'part-area'); $('category-tabs').append(button);
    }
    for (const color of colors) {
      const button = document.createElement('button'); button.type = 'button'; button.className = `swatch${color.id === 'original' ? ' swatch-original' : ''}`;
      button.style.setProperty('--swatch', color.color); button.dataset.color = color.id;
      button.title = color.name; button.setAttribute('aria-label', color.name); $('swatches').append(button);
    }
    syncForm(); updateSwatches(); bindEvents();
    try {
      await Promise.all(Object.entries(assets).map(async ([id, asset]) => {
        const image = new Image(); image.src = asset.src; await image.decode(); images.set(id, image);
      }));
      await document.fonts.ready;
      for (const preset of presets) preset.thumbnail = presetThumbnail(preset);
      ready = true; updateTab(); render(); parent.postMessage({type:'character:ready'},location.origin); $('loading-overlay').hidden = true; $('random-button').disabled = false;
      if (!storageAvailable) $('save-state').textContent = '当前浏览器无法保存';
    } catch (error) {
      console.error('素材加载失败', error);
      $('loading-overlay').textContent = '素材加载失败，请确认 assets.js 与网页在同一文件夹，再刷新页面。';
      notify('素材尚未就绪，请刷新页面后重试。');
    }
  }
  window.addEventListener('message', event => {
    if (event.source !== parent || event.origin !== location.origin) return;
    if (event.data?.type === 'character:restore' && event.data.appearance && typeof event.data.appearance === 'object') {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(event.data.appearance)); restoreState(); if (ready) {syncForm(); updateOptions(); updateSwatches(); render();} } catch { /* Keep current appearance if storage is unavailable. */ }
    }
    if (event.data?.type === 'character:export' && typeof event.data.requestId === 'string' && ready) {
      render();
      parent.postMessage({type:'character:portrait',requestId:event.data.requestId,portrait:portraitCanvas.toDataURL('image/png'),appearance:{version:1,parts:state.parts,adjustments:state.adjustments,hairColor:state.hairColor,hairPreset:state.hairPreset}},location.origin);
    }
  });
  document.addEventListener('keydown', event => { if(event.key === 'Escape') parent.postMessage({type:'character:close'},location.origin); });
  init();
})();
