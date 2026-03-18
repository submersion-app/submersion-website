(() => {
  const yearNode = document.querySelector('[data-year]');
  if (yearNode) yearNode.textContent = String(new Date().getFullYear());

  const REPO = 'submersion-app/submersion';
  const RELEASES_URL = 'https://github.com/' + REPO + '/releases';
  const API_URL = 'https://api.github.com/repos/' + REPO + '/releases';
  const APP_STORE_URL = 'https://apps.apple.com/us/app/submersion-dive-log/id6757456915';

  const PLATFORMS = {
    macos:   { suffix: '-macOS.dmg',    label: 'macOS',   icon: 'apple' },
    windows: { suffix: '-Windows.zip',  label: 'Windows', icon: 'windows' },
    linux:   { suffix: '-Linux.tar.gz', label: 'Linux',   icon: 'linux' },
    android: { suffix: '-Android.apk',  label: 'Android', icon: 'android' },
    ios:     { label: 'iOS', icon: 'apple', storeUrl: APP_STORE_URL },
  };

  var ICONS = {};
  ICONS.apple = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>';
  ICONS.windows = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>';
  ICONS.linux = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.368 1.884 1.43.868.074 1.741-.136 2.393-.523.654-.4 1.086-.926 1.178-1.602.066-.534.054-1.134-.073-1.69.097-.1.178-.264.23-.396.285-.795-.049-1.597-.285-2.095-.149-.266-.397-.467-.574-.734-.201-.266-.432-.332-.66-.554-.118-.133-.211-.2-.295-.4-.09-.201-.07-.401-.07-.601 0-.268-.009-.469-.036-.669-.046-.399-.091-.731-.02-1.136.07-.405.209-.748.23-1.468.02-1.535-.658-3.168-1.628-4.382-1.476-1.884-1.457-2.252-1.457-4.148 0-2.1-.937-3.602-3.117-3.734a3.432 3.432 0 00-.372-.013"/></svg>';
  ICONS.android = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.341a1 1 0 01-.996-.996 1 1 0 01.996-.996 1 1 0 01.997.996 1 1 0 01-.997.996m-11.046 0a1 1 0 01-.997-.996 1 1 0 01.997-.996 1 1 0 01.996.996 1 1 0 01-.996.996m11.405-6.02l1.99-3.44a.416.416 0 00-.152-.567.416.416 0 00-.568.152L17.12 8.95c-1.546-.7-3.273-1.09-5.12-1.09-1.848 0-3.575.39-5.12 1.09L4.847 5.466a.416.416 0 00-.567-.152.416.416 0 00-.153.567l1.99 3.44C2.688 11.186.343 14.681 0 18.761h24c-.344-4.08-2.688-7.575-6.118-9.44"/></svg>';
  ICONS.download = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

  function detectPlatform() {
    var ua = navigator.userAgent || '';
    var platform = navigator.platform || '';
    if (/Macintosh|MacIntel|MacPPC|Mac68K/i.test(platform) || /Mac OS X/i.test(ua)) return 'macos';
    if (/Win32|Win64|Windows|WinCE/i.test(platform) || /Windows/i.test(ua)) return 'windows';
    if (/Android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Linux/i.test(platform)) return 'linux';
    return null;
  }

  function formatSize(bytes) {
    var mb = bytes / (1024 * 1024);
    return mb >= 1000 ? (mb / 1024).toFixed(1) + ' GB' : Math.round(mb) + ' MB';
  }

  function matchAssets(assets) {
    var matched = {};
    var keys = Object.keys(PLATFORMS);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var config = PLATFORMS[key];
      for (var j = 0; j < assets.length; j++) {
        if (assets[j].name.endsWith(config.suffix)) {
          matched[key] = {
            url: assets[j].browser_download_url,
            size: assets[j].size,
            name: assets[j].name,
          };
          break;
        }
      }
    }
    return matched;
  }

  function createIconElement(iconKey) {
    var template = document.createElement('template');
    template.innerHTML = ICONS[iconKey] || '';
    return template.content.firstChild;
  }

  function renderDownloads(tag, assetMap, detectedPlatform) {
    var primaryBtn = document.getElementById('download-primary');
    var primaryIcon = document.getElementById('download-primary-icon');
    var primaryLabel = document.getElementById('download-primary-label');
    var primaryMeta = document.getElementById('download-primary-meta');
    var platformsContainer = document.getElementById('download-platforms');

    if (!primaryBtn || !platformsContainer) return;

    if (detectedPlatform === 'ios') {
      primaryBtn.href = APP_STORE_URL;
      primaryBtn.target = '_blank';
      primaryBtn.rel = 'noreferrer';
      var appleIcon = createIconElement('apple');
      if (appleIcon) {
        primaryIcon.textContent = '';
        primaryIcon.appendChild(appleIcon);
      }
      primaryLabel.textContent = 'Download on the App Store';
      primaryMeta.textContent = '';
    } else if (detectedPlatform && assetMap[detectedPlatform]) {
      var config = PLATFORMS[detectedPlatform];
      var asset = assetMap[detectedPlatform];
      primaryBtn.href = asset.url;
      primaryBtn.removeAttribute('target');
      primaryBtn.removeAttribute('rel');
      var dlIcon = createIconElement('download');
      if (dlIcon) {
        primaryIcon.textContent = '';
        primaryIcon.appendChild(dlIcon);
      }
      primaryLabel.textContent = 'Download for ' + config.label;
      primaryMeta.textContent = tag + ' \u00B7 ' + formatSize(asset.size);
    } else {
      var dlIcon2 = createIconElement('download');
      if (dlIcon2) {
        primaryIcon.textContent = '';
        primaryIcon.appendChild(dlIcon2);
      }
      primaryLabel.textContent = 'Download';
      primaryMeta.textContent = tag;
    }

    var fragment = document.createDocumentFragment();
    var keys = Object.keys(PLATFORMS);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var pConfig = PLATFORMS[key];
      var pAsset = assetMap[key];
      var a = document.createElement('a');
      a.className = 'download__platform' + (key === detectedPlatform ? ' download__platform--active' : '');

      if (pConfig.storeUrl) {
        a.href = pConfig.storeUrl;
        a.target = '_blank';
        a.rel = 'noreferrer';
      } else {
        a.href = pAsset ? pAsset.url : RELEASES_URL;
        if (!pAsset) {
          a.target = '_blank';
          a.rel = 'noreferrer';
        }
      }

      var icon = createIconElement(pConfig.icon);
      if (icon) a.appendChild(icon);
      a.appendChild(document.createTextNode(' ' + pConfig.label));
      if (!pConfig.storeUrl && pAsset) {
        a.title = pAsset.name + ' (' + formatSize(pAsset.size) + ')';
      }
      fragment.appendChild(a);
    }
    platformsContainer.appendChild(fragment);
  }

  async function fetchLatestRelease() {
    var controller = new AbortController();
    var timeout = setTimeout(function() { controller.abort(); }, 5000);

    try {
      var res = await fetch(API_URL, {
        signal: controller.signal,
        headers: { Accept: 'application/vnd.github.v3+json' },
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error('GitHub API ' + res.status);

      var releases = await res.json();
      var release = null;
      for (var i = 0; i < releases.length; i++) {
        if (!releases[i].draft && !releases[i].prerelease) { release = releases[i]; break; }
      }
      if (!release) throw new Error('No published release found');

      return { tag: release.tag_name, assets: release.assets };
    } catch (err) {
      clearTimeout(timeout);
      console.error('Failed to fetch releases:', err);
      return null;
    }
  }

  async function init() {
    var detectedPlatform = detectPlatform();
    var release = await fetchLatestRelease();

    if (release) {
      var assetMap = matchAssets(release.assets);
      renderDownloads(release.tag, assetMap, detectedPlatform);
    } else {
      renderDownloads('', {}, detectedPlatform);
    }
  }

  init();
})();
