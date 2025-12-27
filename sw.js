// ==============================
// Defaults
// ==============================
const DEFAULT_OPTIONS = {
  onlyCurrentWindow: true,
  excludeCurrentTab: true,
  excludePinnedTabs: true,
  excludeAudibleTabs: true,
  excludeTitleKeywords: [],
  excludeUrlKeywords: []
};

// ==============================
// Helpers
// ==============================
const storageGet = (keys = null) =>
  new Promise((resolve) => chrome.storage.sync.get(keys, resolve));

const storageSet = (data) =>
  new Promise((resolve) => chrome.storage.sync.set(data, resolve));

const getCurrentTab = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });
  return tab;
};

// ==============================
// Install / Init
// ==============================
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await storageGet();
  if (Object.keys(existing).length === 0) {
    await storageSet(DEFAULT_OPTIONS);
  }
});

// ==============================
// Main Action
// ==============================
chrome.action.onClicked.addListener(async () => {
  const options = await storageGet(DEFAULT_OPTIONS);
  const currentTab = await getCurrentTab();

  const query = {
    discarded: false,
    ...(options.onlyCurrentWindow && { currentWindow: true })
  };

  const tabs = await chrome.tabs.query(query);

  for (const tab of tabs) {
    if (shouldExcludeTab(tab, currentTab, options)) continue;
    await chrome.tabs.discard(tab.id);
  }

  showSuccessBadge();
});

// ==============================
// Logic
// ==============================
const shouldExcludeTab = (tab, currentTab, options) => {
  if (options.excludeCurrentTab && tab.id === currentTab?.id) return true;
  if (options.excludePinnedTabs && tab.pinned) return true;
  if (options.excludeAudibleTabs && tab.audible) return true;

  if (matchesKeywords(tab.title, options.excludeTitleKeywords)) return true;
  if (matchesKeywords(tab.url, options.excludeUrlKeywords)) return true;

  return false;
};

const matchesKeywords = (text = '', keywords = []) =>
  keywords.some((kw) => text.toLowerCase().includes(kw));

// ==============================
// UI Feedback
// ==============================
const showSuccessBadge = () => {
  chrome.action.setBadgeText({ text: 'OK' });
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });

  setTimeout(() => {
    chrome.action.setBadgeText({ text: '' });
  }, 2000);
};
