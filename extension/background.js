let port = browser.runtime.connectNative("cli_tabs_bridge");

function postMessage(msg) {
  console.log("[OUT]", msg);
  port.postMessage(msg);
}

postMessage({ type: "extension_ready" });

port.onMessage.addListener((msg) => {
  console.log("[IN]", msg);
  if (msg.type === "query_tabs") {
    browser.tabs.query({}).then((tabs) => {
      const tabData = tabs.map((t) => ({ title: t.title, url: t.url }));
      postMessage({ type: "tabs", tabs: tabData });
    });
  } else if (msg.type === "close_domain") {
    browser.tabs.query({ url: `*://*.${msg.domain}/*` }).then((tabs) => {
      const tabData = tabs.map((t) => ({ title: t.title, url: t.url }));
      tabs.forEach((tab) => browser.tabs.remove(tab.id));
      postMessage({ type: "closed_tabs", tabs: tabData });
    });
  }
});
