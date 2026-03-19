let port = browser.runtime.connectNative("cli_tabs_bridge");

function postMessage(msg) {
  console.log("[OUT]", msg);
  port.postMessage(msg);
}

function mapTab(t) {
  return { title: t.title, url: t.url };
}

function extractTabs(tabs) {
  return tabs.map((t) => mapTab(t));
}

async function forceClose(tabId) {
  try {
    // inject a script to kill the 'beforeunload' prompt
    // this is to handle sites like music.youtube.com that prompt before close if music is playing
    await browser.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        const blocker = (e) => {
          e.stopImmediatePropagation();
          e.stopPropagation();
        };

        window.addEventListener("beforeunload", blocker, true);
        window.addEventListener("unload", blocker, true);

        // Also clear the standard property just in case
        window.onbeforeunload = null;
      },
    });
  } catch (e) {
    console.error(e);
  }
  await browser.tabs.remove(tabId);
}

postMessage({ type: "extension_ready" });

port.onMessage.addListener((msg) => {
  console.log("[IN]", msg);
  if (msg.type === "query_tabs") {
    browser.tabs.query({}).then((tabs) => {
      const tabData = extractTabs(tabs);
      postMessage({ type: "tabs", tabs: tabData });
    });
  } else if (msg.type === "close_domain") {
    browser.tabs.query({ url: `*://*.${msg.domain}/*` }).then((tabs) => {
      const tabData = extractTabs(tabs);
      tabs.forEach((tab) => forceClose(tab.id));
      postMessage({ type: "closed_tabs", tabs: tabData });
    });
  }
});
