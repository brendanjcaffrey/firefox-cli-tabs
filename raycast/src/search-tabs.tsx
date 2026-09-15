import { Action, ActionPanel, closeMainWindow, Icon, List, showToast, Toast, Keyboard } from "@raycast/api";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getFavicon, showFailureToast, usePromise } from "@raycast/utils";
import { closeTabs, focusTab, queryTabs, Tab } from "./client";

// only web pages have a real domain; about:, moz-extension:, file: etc. don't
function webHostname(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.hostname : undefined;
  } catch {
    return undefined;
  }
}

export default function Command() {
  const {
    data: tabs,
    isLoading,
    revalidate,
    mutate,
  } = usePromise(queryTabs, [], {
    onError: async (error) => {
      await showFailureToast(error, { title: "Failed to load tabs" });
    },
  });

  async function switchTo(tab: Tab) {
    try {
      await focusTab(tab.id);
      await promisify(execFile)("open", ["-a", "Firefox"]);
      await closeMainWindow({ clearRootSearch: true });
    } catch (error) {
      await showFailureToast(error, { title: "Failed to switch tab" });
    }
  }

  async function close(toClose: Tab[]) {
    const ids = new Set(toClose.map((t) => t.id));
    try {
      await mutate(closeTabs([...ids]), {
        optimisticUpdate: (current) => (current ?? []).filter((t) => !ids.has(t.id)),
      });
      await showToast({
        style: Toast.Style.Success,
        title: toClose.length === 1 ? "Closed tab" : `Closed ${toClose.length} tabs`,
      });
    } catch (error) {
      await showFailureToast(error, { title: "Failed to close tabs" });
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search tabs by title or URL">
      {tabs?.map((tab) => {
        const domain = webHostname(tab.url);
        const sameDomain = domain ? tabs.filter((t) => webHostname(t.url) === domain) : [];
        return (
          <List.Item
            key={tab.id}
            // getFavicon prefixes non-http urls with https://, which makes about:addons an invalid url
            icon={domain ? getFavicon(tab.url, { fallback: Icon.Globe }) : Icon.Globe}
            title={tab.title || tab.url}
            subtitle={domain}
            keywords={domain ? [tab.url, domain] : [tab.url]}
            accessories={tab.active ? [{ icon: Icon.Eye, tooltip: "Active in its window" }] : []}
            actions={
              <ActionPanel>
                <Action title="Switch to Tab" icon={Icon.ArrowRight} onAction={() => switchTo(tab)} />
                <Action
                  title="Close Tab"
                  icon={Icon.XMarkCircle}
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["ctrl"], key: "x" }}
                  onAction={() => close([tab])}
                />
                {domain && (
                  <Action
                    title={`Close All ${domain} Tabs (${sameDomain.length})`}
                    icon={Icon.XMarkCircleFilled}
                    style={Action.Style.Destructive}
                    shortcut={{ modifiers: ["ctrl", "shift"], key: "x" }}
                    onAction={() => close(sameDomain)}
                  />
                )}
                <Action.CopyToClipboard
                  title="Copy URL"
                  content={tab.url}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  shortcut={Keyboard.Shortcut.Common.Refresh}
                  onAction={revalidate}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
