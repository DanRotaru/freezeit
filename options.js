// ==============================
// Constants
// ==============================
const BOOLEAN_FIELDS = [
  'onlyCurrentWindow',
  'excludeCurrentTab',
  'excludePinnedTabs',
  'excludeAudibleTabs'
];

const TEXT_FIELDS = {
  excludeTitleKeywords: 'excludeTitleKeywords',
  excludeUrlKeywords: 'excludeUrlKeywords'
};

const ALLOWED_FIELDS = [
  ...BOOLEAN_FIELDS,
  ...Object.values(TEXT_FIELDS)
];

// ==============================
// DOM
// ==============================
const $ = (id) => document.getElementById(id);

const titleTextarea = $(TEXT_FIELDS.excludeTitleKeywords);
const urlTextarea = $(TEXT_FIELDS.excludeUrlKeywords);
const fileInput = $('fileInput');

// ==============================
// Storage helpers (Promise-based)
// ==============================
const storageGet = (keys = null) =>
  new Promise((resolve) => chrome.storage.sync.get(keys, resolve));

const storageSet = (data) =>
  new Promise((resolve) => chrome.storage.sync.set(data, resolve));

// ==============================
// Utils
// ==============================
const splitLines = (text) =>
  text
    .split('\n')
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean);

// ==============================
// Load / Save
// ==============================
const loadOptions = async () => {
  const data = await storageGet();

  BOOLEAN_FIELDS.forEach((id) => {
    $(id).checked = Boolean(data[id]);
  });

  titleTextarea.value = (data.excludeTitleKeywords || []).join('\n');
  urlTextarea.value = (data.excludeUrlKeywords || []).join('\n');
};

const saveOptions = async () => {
  const data = {};

  BOOLEAN_FIELDS.forEach((id) => {
    data[id] = $(id).checked;
  });

  data.excludeTitleKeywords = splitLines(titleTextarea.value);
  data.excludeUrlKeywords = splitLines(urlTextarea.value);

  await storageSet(data);
};

// ==============================
// Export
// ==============================
const exportConfig = async () => {
  const data = await storageGet();

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = 'freeze-tabs-config.json';
  a.click();

  URL.revokeObjectURL(url);
};

// ==============================
// Import
// ==============================
const importConfig = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async () => {
    try {
      const parsed = JSON.parse(reader.result);
      const filteredData = {};

      ALLOWED_FIELDS.forEach((key) => {
        if (key in parsed) {
          filteredData[key] = parsed[key];
        }
      });

      await storageSet(filteredData);
      await loadOptions();
      alert('Configuration imported successfully');
    } catch (err) {
      alert('Invalid JSON file');
    } finally {
      fileInput.value = '';
    }
  };

  reader.readAsText(file);
};

// ==============================
// Events
// ==============================
document.addEventListener('DOMContentLoaded', loadOptions);

document.querySelectorAll('input, textarea').forEach((el) => {
  el.addEventListener('change', saveOptions);
});

$('export').addEventListener('click', exportConfig);
$('import').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', importConfig);
