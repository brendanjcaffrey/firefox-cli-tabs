# Firefox CLI Tabs

Firefox extension to allow managing your tabs from the command line.

Once installed, run `./query_tabs` to get a list of all open tabs or `./close_domain example.com` to close all tabs matching example.com.

Each tab in `./query_tabs` output has an `id`. Use `./close_tabs 12 34` to close specific tabs, or `./focus_tab 12` to switch to a tab.

### Raycast extension

`raycast/` contains a Raycast extension to search, switch to, and close tabs. Run `rake raycast:dev` to load it into Raycast locally, or `rake raycast:publish` to publish it to the jcaffrey organization store (needs `npx ray login` first).

### Logo

The icons for both extensions are generated from `logo/logo.svg`. After editing it, run `rake logo:generate` (needs `rsvg-convert` from `brew install librsvg`).

### Install the native portion

The extension requires an external script to handle communication with Firefox. If you run `native/copy.sh`, it will generate a `manifest.json` file for you from the template in `native/manifest.json` and place it where Firefox expects it to be.

### Testing the extension

- clone this repository
- go to `about:debugging` in Firefox, click on `This Firefox` and `Load Temporary Add-on...`
- select the `extension/manifest.json` file
- run `./query_tabs` in this repo to make sure it works

#### Debugging tips

- first check if the native script is running with `ps -ef | grep native.py`. if not, open the _browser_ console (not the extension console) with Cmd+Shift+J and put it in Multiprocess mode. see if there's an error when you reload the extension.
- if the script is running, check its logs in `/tmp/firefox_cli_tabs.log`
- also check the extension console, there's an Inspect button on the `about:debugging` page
- if you had the extension installed from the developer hub, then remove it to try and debug, you might want to change `browser_specific_settings.gecko.id`, re-run `native/copy.sh` and reload the extension

### Permanently installing the extension

This is a bit more involved, but you won't have to load the extension every time you open Firefox.

#### Uploading a private build to Mozilla Developer Hub

- if you don't have `web-ext` installed, install that first via: `npm install -g web-ext`
- clone this repository
- in `extension/manifest.json`, make sure to set the `browser_specific_settings.gecko.id` to something unique and possibly bump the `version`
  - if you change the `browser_specific_settings.gecko.id`, you'll need to re-run the `native/copy.sh` script
- run `rake firefox:archive` to lint the extension with `web-ext` and zip it into `build/cli-tabs-<version>.zip`
- go the [Developer Hub](https://addons.mozilla.org/en-US/developers/)
- sign in or create an account

#### Submitting a new add on

- go to [Submit a New Add-on](https://addons.mozilla.org/en-US/developers/addon/submit/agreement), distribute on your own, and upload the zip file from `build/`
- wait a bit for it to be approved (you'll get an email notification when it is)
- go to [My Add-ons](https://addons.mozilla.org/en-US/developers/addons), select `CLI Tabs`, then `View All` in the left column
- click on the latest version and download the `xpi` file, then agree to add the extension

#### Uploading a new version

- go to [My Add-ons](https://addons.mozilla.org/en-US/developers/addons), select `CLI Tabs`, then `Upload New Version` in the left column
- upload the zip file from `build/`
- wait a bit for it to be approved (you'll get an email notification when it is)
- click on the latest version and download the `xpi` file, then agree to add the extension
