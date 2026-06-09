"use strict";

const ROM_SIZE = 32 * 1024 * 1024;
const ROM_TITLE_OFFSET = 0xA0;
const ROM_CODE_OFFSET = 0xAC;
const POKEMON_OFFSET = 0x5B4764;
const POKEMON_RECORD_SIZE = 36;
const MOVE_OFFSET = 0x5ACD5C;
const MOVE_RECORD_SIZE = 20;
const LIST_LIMIT = 140;

const pokemonFields = [
  { key: "hp", element: "pkmHp", offset: 0, min: 0, max: 255, label: "HP", type: "u8" },
  { key: "atk", element: "pkmAtk", offset: 1, min: 0, max: 255, label: "攻击", type: "u8" },
  { key: "def", element: "pkmDef", offset: 2, min: 0, max: 255, label: "防御", type: "u8" },
  { key: "speed", element: "pkmSpeed", offset: 3, min: 0, max: 255, label: "速度", type: "u8" },
  { key: "spAtk", element: "pkmSpAtk", offset: 4, min: 0, max: 255, label: "特攻", type: "u8" },
  { key: "spDef", element: "pkmSpDef", offset: 5, min: 0, max: 255, label: "特防", type: "u8" },
  { key: "type1", element: "pkmType1", offset: 6, label: "属性 1", type: "u8" },
  { key: "type2", element: "pkmType2", offset: 7, label: "属性 2", type: "u8" },
  { key: "ability1", element: "pkmAbility1", offset: 24, label: "普通特性 1", type: "u16" },
  { key: "ability2", element: "pkmAbility2", offset: 26, label: "普通特性 2", type: "u16" },
  { key: "hiddenAbility", element: "pkmHiddenAbility", offset: 28, label: "隐藏特性", type: "u16" }
];

const moveFields = [
  { key: "power", element: "movePower", offset: 2, min: 0, max: 999, label: "威力", type: "u16" },
  { key: "type", element: "moveType", offset: 4, label: "属性", type: "u8" },
  { key: "accuracy", element: "moveAccuracy", offset: 5, min: 0, max: 100, label: "命中率", type: "u8" },
  { key: "pp", element: "movePp", offset: 6, min: 0, max: 255, label: "PP", type: "u8" },
  { key: "secondary", element: "moveSecondary", offset: 7, min: 0, max: 100, label: "二级效果概率", type: "u8" },
  { key: "target", element: "moveTarget", offset: 8, label: "目标范围", type: "u16" },
  { key: "priority", element: "movePriority", offset: 10, min: -7, max: 7, label: "优先级", type: "s8" },
  { key: "category", element: "moveCategory", offset: 16, label: "分类", type: "u8" }
];

const state = {
  catalog: null,
  rom: null,
  original: null,
  fileName: "",
  selectedPokemon: 1,
  selectedMove: 1,
  activeView: "pokemon"
};

const $ = (id) => document.getElementById(id);

const els = {
  romFile: $("romFile"),
  romStatus: $("romStatus"),
  catalogStatus: $("catalogStatus"),
  changeCounter: $("changeCounter"),
  saveTopButton: $("saveTopButton"),
  saveMainButton: $("saveMainButton"),
  pokemonSearch: $("pokemonSearch"),
  pokemonList: $("pokemonList"),
  pokemonTitle: $("pokemonTitle"),
  pokemonSubtitle: $("pokemonSubtitle"),
  pokemonStatTotal: $("pokemonStatTotal"),
  restorePokemonButton: $("restorePokemonButton"),
  moveSearch: $("moveSearch"),
  moveList: $("moveList"),
  moveTitle: $("moveTitle"),
  moveSubtitle: $("moveSubtitle"),
  restoreMoveButton: $("restoreMoveButton"),
  saveSubtitle: $("saveSubtitle"),
  changeSummary: $("changeSummary")
};

async function boot() {
  bindEvents();
  setEditorsEnabled(false);
  try {
    const response = await fetch("data/catalog.json");
    if (!response.ok) {
      throw new Error("目录文件读取失败");
    }
    state.catalog = await response.json();
    els.catalogStatus.textContent = `已载入 ${state.catalog.pokemon.length} 个宝可梦、${state.catalog.moves.length} 个招式`;
    fillSelect("pkmType1", state.catalog.types);
    fillSelect("pkmType2", state.catalog.types);
    fillSelect("moveType", state.catalog.types);
    fillSelect("pkmAbility1", state.catalog.abilities);
    fillSelect("pkmAbility2", state.catalog.abilities);
    fillSelect("pkmHiddenAbility", state.catalog.abilities);
    fillSelect("moveTarget", state.catalog.targets, "value");
    fillSelect("moveCategory", state.catalog.categories, "value");
    renderPokemonList();
    renderMoveList();
    renderPokemonForm();
    renderMoveForm();
    updateSaveState();
  } catch (error) {
    els.catalogStatus.textContent = "数据目录加载失败";
    els.romStatus.textContent = error.message;
  }
}

function bindEvents() {
  document.querySelectorAll("[data-view-button]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.viewButton));
  });

  els.romFile.addEventListener("change", openRom);
  els.saveTopButton.addEventListener("click", saveRomCopy);
  els.saveMainButton.addEventListener("click", saveRomCopy);
  els.pokemonSearch.addEventListener("input", renderPokemonList);
  els.moveSearch.addEventListener("input", renderMoveList);
  els.restorePokemonButton.addEventListener("click", restoreSelectedPokemon);
  els.restoreMoveButton.addEventListener("click", restoreSelectedMove);

  pokemonFields.forEach((field) => {
    $(field.element).addEventListener("change", () => writePokemonField(field));
    $(field.element).addEventListener("input", () => {
      if ($(field.element).tagName === "INPUT") writePokemonField(field, true);
    });
  });

  moveFields.forEach((field) => {
    $(field.element).addEventListener("change", () => writeMoveField(field));
    $(field.element).addEventListener("input", () => {
      if ($(field.element).tagName === "INPUT") writeMoveField(field, true);
    });
  });
}

function switchView(view) {
  state.activeView = view;
  document.querySelectorAll("[data-view-button]").forEach((button) => {
    button.classList.toggle("active", button.dataset.viewButton === view);
  });
  document.querySelectorAll("[data-view]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.view === view);
  });
  if (view === "save") {
    updateSaveState();
  }
}

async function openRom(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const validation = validateRom(bytes);

  if (!validation.ok) {
    state.rom = null;
    state.original = null;
    state.fileName = "";
    setEditorsEnabled(false);
    els.romStatus.textContent = validation.message;
    updateSaveState();
    return;
  }

  state.rom = new Uint8Array(buffer.slice(0));
  state.original = new Uint8Array(buffer.slice(0));
  state.fileName = file.name;
  els.romStatus.textContent = `${file.name} 已打开`;
  setEditorsEnabled(true);
  renderPokemonForm();
  renderMoveForm();
  updateSaveState();
}

function validateRom(bytes) {
  if (bytes.length !== ROM_SIZE) {
    return { ok: false, message: "文件大小不符合当前底版" };
  }

  const title = readAscii(bytes, ROM_TITLE_OFFSET, 12).trim();
  const code = readAscii(bytes, ROM_CODE_OFFSET, 4).trim();
  if (title !== "POKEMON EMER" || code !== "BPEE") {
    return { ok: false, message: "当前文件不是支持的西班牙火箭队底版" };
  }

  if (POKEMON_OFFSET + POKEMON_RECORD_SIZE > bytes.length || MOVE_OFFSET + MOVE_RECORD_SIZE > bytes.length) {
    return { ok: false, message: "当前文件缺少必要数据" };
  }

  return { ok: true };
}

function readAscii(bytes, offset, length) {
  let text = "";
  for (let i = 0; i < length; i += 1) {
    const value = bytes[offset + i];
    if (value >= 32 && value <= 126) text += String.fromCharCode(value);
  }
  return text;
}

function fillSelect(id, rows, valueKey = "id") {
  const select = $(id);
  select.innerHTML = "";
  rows.forEach((row) => {
    const option = document.createElement("option");
    option.value = String(row[valueKey]);
    option.textContent = row.name;
    select.appendChild(option);
  });
}

function renderPokemonList() {
  if (!state.catalog) return;
  renderList({
    container: els.pokemonList,
    rows: state.catalog.pokemon.filter((row) => row.id > 0),
    query: els.pokemonSearch.value,
    selectedId: state.selectedPokemon,
    onSelect: (id) => {
      state.selectedPokemon = id;
      renderPokemonList();
      renderPokemonForm();
    }
  });
}

function renderMoveList() {
  if (!state.catalog) return;
  renderList({
    container: els.moveList,
    rows: state.catalog.moves.filter((row) => row.id > 0),
    query: els.moveSearch.value,
    selectedId: state.selectedMove,
    onSelect: (id) => {
      state.selectedMove = id;
      renderMoveList();
      renderMoveForm();
    }
  });
}

function renderList({ container, rows, query, selectedId, onSelect }) {
  const normalized = normalizeSearch(query);
  const filtered = rows.filter((row) => {
    if (!normalized) return row.id === selectedId || row.id <= LIST_LIMIT;
    return normalizeSearch(row.name).includes(normalized) || String(row.id).includes(normalized);
  });

  container.innerHTML = "";
  if (!filtered.length) {
    container.appendChild(textRow("没有匹配条目", "result-empty"));
    return;
  }

  const visible = filtered.slice(0, LIST_LIMIT);
  visible.forEach((row) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `result-item${row.id === selectedId ? " active" : ""}`;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", row.id === selectedId ? "true" : "false");
    button.innerHTML = `<span>${escapeHtml(row.name)}</span><span class="result-id">#${row.id}</span>`;
    button.addEventListener("click", () => onSelect(row.id));
    container.appendChild(button);
  });

  if (filtered.length > LIST_LIMIT) {
    container.appendChild(textRow(`还有 ${filtered.length - LIST_LIMIT} 条，请继续输入筛选`, "result-more"));
  }
}

function textRow(text, className) {
  const div = document.createElement("div");
  div.className = className;
  div.textContent = text;
  return div;
}

function normalizeSearch(value) {
  return String(value || "").trim().toLowerCase();
}

function renderPokemonForm() {
  if (!state.catalog) return;
  const row = state.catalog.pokemon.find((item) => item.id === state.selectedPokemon);
  els.pokemonTitle.textContent = row ? `${row.name} #${row.id}` : "选择宝可梦";

  if (!state.rom) {
    els.pokemonSubtitle.textContent = "打开 ROM 后可编辑当前条目";
    pokemonFields.forEach((field) => {
      $(field.element).value = "";
      $(field.element).classList.remove("field-changed");
    });
    els.pokemonStatTotal.textContent = "总和 0";
    els.restorePokemonButton.disabled = true;
    return;
  }

  const base = getPokemonBase(state.selectedPokemon);
  const values = readFields(base, pokemonFields, state.rom);
  pokemonFields.forEach((field) => {
    $(field.element).value = values[field.key];
    markFieldChanged(field.element, readValue(state.rom, base + field.offset, field.type) !== readValue(state.original, base + field.offset, field.type));
  });
  const total = ["hp", "atk", "def", "speed", "spAtk", "spDef"].reduce((sum, key) => sum + Number(values[key] || 0), 0);
  els.pokemonStatTotal.textContent = `总和 ${total}`;
  els.pokemonSubtitle.textContent = isRecordChanged(base, POKEMON_RECORD_SIZE) ? "当前宝可梦已有修改" : "当前宝可梦未修改";
  els.restorePokemonButton.disabled = !isRecordChanged(base, POKEMON_RECORD_SIZE);
}

function renderMoveForm() {
  if (!state.catalog) return;
  const row = state.catalog.moves.find((item) => item.id === state.selectedMove);
  els.moveTitle.textContent = row ? `${row.name} #${row.id}` : "选择招式";

  if (!state.rom) {
    els.moveSubtitle.textContent = "打开 ROM 后可编辑当前条目";
    moveFields.forEach((field) => {
      $(field.element).value = "";
      $(field.element).classList.remove("field-changed");
    });
    els.restoreMoveButton.disabled = true;
    return;
  }

  const base = getMoveBase(state.selectedMove);
  const values = readFields(base, moveFields, state.rom);
  moveFields.forEach((field) => {
    $(field.element).value = values[field.key];
    markFieldChanged(field.element, readValue(state.rom, base + field.offset, field.type) !== readValue(state.original, base + field.offset, field.type));
  });
  els.moveSubtitle.textContent = isRecordChanged(base, MOVE_RECORD_SIZE) ? "当前招式已有修改" : "当前招式未修改";
  els.restoreMoveButton.disabled = !isRecordChanged(base, MOVE_RECORD_SIZE);
}

function readFields(base, fields, bytes) {
  const values = {};
  fields.forEach((field) => {
    values[field.key] = readValue(bytes, base + field.offset, field.type);
  });
  return values;
}

function writePokemonField(field, live = false) {
  if (!state.rom) return;
  const base = getPokemonBase(state.selectedPokemon);
  if (!writeField(base, field, live)) return;
  renderPokemonForm();
  updateSaveState();
}

function writeMoveField(field, live = false) {
  if (!state.rom) return;
  const base = getMoveBase(state.selectedMove);
  if (!writeField(base, field, live)) return;
  renderMoveForm();
  updateSaveState();
}

function writeField(base, field, live) {
  const control = $(field.element);
  const raw = Number(control.value);
  if (!Number.isFinite(raw)) return false;
  const value = clamp(raw, field.min ?? 0, field.max ?? maxForType(field.type));

  if (!live && String(value) !== control.value) {
    control.value = String(value);
  }
  if (live && (String(control.value).trim() === "" || raw !== value)) {
    return false;
  }

  writeValue(state.rom, base + field.offset, field.type, value);
  return true;
}

function restoreSelectedPokemon() {
  if (!state.rom) return;
  const base = getPokemonBase(state.selectedPokemon);
  copyOriginalRange(base, POKEMON_RECORD_SIZE);
  renderPokemonForm();
  updateSaveState();
}

function restoreSelectedMove() {
  if (!state.rom) return;
  const base = getMoveBase(state.selectedMove);
  copyOriginalRange(base, MOVE_RECORD_SIZE);
  renderMoveForm();
  updateSaveState();
}

function copyOriginalRange(base, size) {
  for (let i = 0; i < size; i += 1) {
    state.rom[base + i] = state.original[base + i];
  }
}

function getPokemonBase(id) {
  return POKEMON_OFFSET + id * POKEMON_RECORD_SIZE;
}

function getMoveBase(id) {
  return MOVE_OFFSET + id * MOVE_RECORD_SIZE;
}

function readValue(bytes, offset, type) {
  if (type === "u16") return bytes[offset] | (bytes[offset + 1] << 8);
  if (type === "s8") return bytes[offset] > 127 ? bytes[offset] - 256 : bytes[offset];
  return bytes[offset];
}

function writeValue(bytes, offset, type, value) {
  if (type === "u16") {
    bytes[offset] = value & 0xff;
    bytes[offset + 1] = (value >> 8) & 0xff;
    return;
  }
  if (type === "s8") {
    bytes[offset] = value < 0 ? 256 + value : value;
    return;
  }
  bytes[offset] = value & 0xff;
}

function maxForType(type) {
  if (type === "u16") return 65535;
  if (type === "s8") return 127;
  return 255;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function markFieldChanged(id, changed) {
  $(id).classList.toggle("field-changed", changed);
}

function setEditorsEnabled(enabled) {
  const controls = document.querySelectorAll(".editor-panel input, .editor-panel select");
  controls.forEach((control) => {
    control.disabled = !enabled;
  });
  els.restorePokemonButton.disabled = true;
  els.restoreMoveButton.disabled = true;
}

function isRecordChanged(base, size) {
  if (!state.rom || !state.original) return false;
  for (let i = 0; i < size; i += 1) {
    if (state.rom[base + i] !== state.original[base + i]) return true;
  }
  return false;
}

function collectChanges() {
  if (!state.rom || !state.catalog) {
    return { pokemon: [], moves: [] };
  }

  const pokemon = state.catalog.pokemon
    .filter((row) => isRecordChanged(getPokemonBase(row.id), POKEMON_RECORD_SIZE))
    .map((row) => ({ ...row, details: describePokemonChanges(row.id) }));

  const moves = state.catalog.moves
    .filter((row) => isRecordChanged(getMoveBase(row.id), MOVE_RECORD_SIZE))
    .map((row) => ({ ...row, details: describeMoveChanges(row.id) }));

  return { pokemon, moves };
}

function describePokemonChanges(id) {
  const base = getPokemonBase(id);
  return pokemonFields
    .filter((field) => readValue(state.rom, base + field.offset, field.type) !== readValue(state.original, base + field.offset, field.type))
    .map((field) => field.label);
}

function describeMoveChanges(id) {
  const base = getMoveBase(id);
  return moveFields
    .filter((field) => readValue(state.rom, base + field.offset, field.type) !== readValue(state.original, base + field.offset, field.type))
    .map((field) => field.label);
}

function updateSaveState() {
  const hasRom = Boolean(state.rom);
  const changes = collectChanges();
  const total = changes.pokemon.length + changes.moves.length;
  els.saveTopButton.disabled = !hasRom;
  els.saveMainButton.disabled = !hasRom;

  if (!hasRom) {
    els.changeCounter.textContent = "尚未载入 ROM";
    els.saveSubtitle.textContent = "修改后的 ROM 会作为新文件下载，原文件不会被覆盖";
    els.changeSummary.textContent = "打开 ROM 后会显示修改清单";
    return;
  }

  els.changeCounter.textContent = total ? `已有 ${total} 个条目修改` : "当前没有修改";
  els.saveSubtitle.textContent = `${state.fileName} 的副本将被下载`;
  els.changeSummary.innerHTML = buildSummaryHtml(changes);
}

function buildSummaryHtml(changes) {
  const total = changes.pokemon.length + changes.moves.length;
  const topRows = [...changes.pokemon.map((row) => ({ type: "宝可梦", row })), ...changes.moves.map((row) => ({ type: "招式", row }))].slice(0, 30);
  const more = total - topRows.length;
  const countClass = total ? "pill changed" : "pill";

  let html = `<div class="summary-counts"><span class="${countClass}">宝可梦 ${changes.pokemon.length}</span><span class="${countClass}">招式 ${changes.moves.length}</span></div>`;
  if (!total) {
    html += "<p>保存会下载一份未修改副本。</p>";
    return html;
  }

  html += "<ul>";
  topRows.forEach(({ type, row }) => {
    html += `<li>${type}：${escapeHtml(row.name)} #${row.id}，${escapeHtml(row.details.join("、"))}</li>`;
  });
  if (more > 0) {
    html += `<li>另有 ${more} 个条目</li>`;
  }
  html += "</ul>";
  return html;
}

function saveRomCopy() {
  if (!state.rom) return;
  const blob = new Blob([state.rom], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = makeOutputName(state.fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function makeOutputName(fileName) {
  const base = fileName.replace(/\.gba$/i, "");
  return `${base}.modified.gba`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

boot();
