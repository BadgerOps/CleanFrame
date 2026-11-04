/* Public Tizen application APIs. No Mac server, network address or credentials. */
(function () {
  'use strict';
  var IDS = {
    jellyfin: 'AprZAARz4r.Jellyfin', tizentube: 'xvvl3S1TT1.TizenTubeStandalone',
    livetv: 'org.tizen.tv-viewer',
    disneyplus: 'MCmYXNxgcu.DisneyPlus', youtube: '9Ur5IzDKqV.TizenYouTube',
    appletv: 'com.samsung.tv.aria-video', primevideo: 'org.tizen.primevideo',
    abciview: 'mWK87Xghap.ABCiview', sbs: 'OyE7OuxlUi.SBSOnDemand',
    applemusic: 'org.tizen.apple.apple-music'
  };
  var STREAMING = ['as6cYRgkPy.Binge', '73iTZRTc34.Stan', '5b8c3eb16b.BeamCTVDev',
    'KaLitts8bq.tenplaySamsungTizen', 'eYuOiOLYQX.KayoSports', 'Ne2ZsPWdKl.9NOW',
    '3KA0pm7a7V.TubiTV', 'rJeHak5zRg.Spotify', 'icp4AvUPiA.7plus'];
  var CONSUMER_SYSTEM = ['org.tizen.browser', 'com.microsoft.copilot'];
  var EXTRA_BRANDS = {'rJeHak5zRg.Spotify': 'spotify', '5b8c3eb16b.BeamCTVDev': 'hbomax', '3KA0pm7a7V.TubiTV': 'tubi'};
  var INTERNAL = ['adplatform.ADPlayer', 'WykOS4t4F0.cmsWebApp', '25emanual3.emanual',
    'ZODRT12q2l.WebAccountExtension', 'ByJlgt0XeD.CastSettingsApp', 'tv6pbVMQFF.PrivacyChoices'];
  var SELF = 'BadgrFrm01.CleanFrame';
  function api() { return window.tizen && window.tizen.application; }
  function unavailable(done) {
    done({ message: 'Open CleanFrame on the TV to use this control.', detail: 'The web preview cannot control the TV.' });
  }
  function failure(err) {
    return { message: 'The TV could not open this screen.', detail: err && (err.message || err.name) || 'Try again, or press the remote’s Home button to return to CleanFrame.' };
  }
  function bounded(done) {
    var finished = false, timer = setTimeout(function () { finish({ message: 'The TV did not respond. Please try again.' }); }, 8000);
    function finish(err, value) { if (finished) return; finished = true; clearTimeout(timer); done(err, value); }
    return finish;
  }
  function launchApp(id, done) {
    if (!api()) { unavailable(done); return; }
    if (id === IDS.tizentube) { launchTizenTube(done); return; }
    var finish = bounded(done);
    try { api().launch(id, function () { finish(null); }, function (err) { finish(failure(err)); }); }
    catch (err) { finish(failure(err)); }
  }
  function launchTizenTube(done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done), control;
    try {
      control = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/service');
      api().launchAppControl(control, 'xvvl3S1TT1.StandaloneService', function () {
        setTimeout(function () {
          try { api().launch(IDS.tizentube, function () { finish(null); }, function (err) { finish(failure(err)); }); }
          catch (err) { finish(failure(err)); }
        }, 5000);
      }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  function launch(brand, done) {
    if (!IDS[brand]) { done({message: 'This app has no launch target.'}); return; }
    launchApp(IDS[brand], done);
  }
  function art(done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    try {
      var data = [new tizen.ApplicationControlData('mode', ['fullscreen']), new tizen.ApplicationControlData('requester', ['mobile'])];
      var control = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/default', null, null, null, data);
      api().launchAppControl(control, 'org.tizen.art-app', function () { finish(null); }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  function home(done) { launchApp('com.samsung.tv.csfs', done); }
  function settings(done) { launchApp('com.samsung.tv.coba.setting', done); }
  var previewSource = null;
  function videoSource(type, number, done) {
    if (!window.tizen || !tizen.systeminfo || !tizen.tvwindow) { unavailable(done); return; }
    try {
      tizen.systeminfo.getPropertyValue('VIDEOSOURCE', function (sources) {
        var available = (sources && sources.connected || []).concat(sources && sources.disconnected || []), target = null, i;
        for (i = 0; i < available.length; i++) {
          if (available[i].type === type && (number === null || Number(available[i].number) === Number(number))) { target = available[i]; break; }
        }
        if (!target) { done({ message: type === 'TV' ? 'The OTA tuner is unavailable.' : 'HDMI ' + number + ' is unavailable.', detail: type === 'TV' ? 'Check that antenna channels have been scanned in TV settings.' : 'Connect or wake the device, then try again.' }); return; }
        done(null, target);
      }, function (err) { done(failure(err)); });
    } catch (err) { done(failure(err)); }
  }
  function setVideoSource(type, number, done) {
    videoSource(type, number, function (err, source) {
      if (err) { done(err); return; }
      try { tizen.tvwindow.setSource(source, function () { done(null, source); }, function (e) { done(failure(e)); }); }
      catch (e) { done(failure(e)); }
    });
  }
  function openViewer(type, number, done) {
    var finish = bounded(done);
    setVideoSource(type, number, function (err) {
      if (err) { finish(err); return; }
      previewSource = null;
      try { api().launch(IDS.livetv, function () { finish(null); }, function (e) { finish(failure(e)); }); }
      catch (e) { finish(failure(e)); }
    });
  }
  function liveTv(done) { openViewer('TV', null, done); }
  function input(number, done) { openViewer('HDMI', number, done); }
  function previewInput(number, rectangle, done) {
    if (!window.tizen || !tizen.tvwindow) { unavailable(done); return; }
    var finish = bounded(done);
    try { if (!previewSource) previewSource = tizen.tvwindow.getSource('MAIN'); } catch (e) { previewSource = null; }
    setVideoSource('HDMI', number, function (err) {
      if (err) { finish(err); return; }
      try { tizen.tvwindow.show(function () { finish(null); }, function (e) { finish(failure(e)); }, rectangle, 'MAIN', 'FRONT'); }
      catch (e) { finish(failure(e)); }
    });
  }
  function closePreview(restore, done) {
    if (!window.tizen || !tizen.tvwindow) { if (done) done(null); return; }
    var original = previewSource; previewSource = null;
    function hide() {
      try { tizen.tvwindow.hide(function () { if (done) done(null); }, function () { if (done) done(null); }, 'MAIN'); }
      catch (e) { if (done) done(null); }
    }
    if (restore && original) {
      try { tizen.tvwindow.setSource(original, hide, hide, 'MAIN'); }
      catch (e) { hide(); }
    } else hide();
  }
  function apps(done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    try {
      api().getAppsInfo(function (list) {
        var known = {}, seen = {}, result = [];
        Object.keys(IDS).forEach(function (brand) { known[IDS[brand]] = brand; });
        list.forEach(function (a) {
          var primary = !!known[a.id], stream = STREAMING.indexOf(a.id) >= 0;
          var consumer = /^[A-Za-z0-9]{10}\.[A-Za-z0-9_-]+$/.test(a.id) || CONSUMER_SYSTEM.indexOf(a.id) >= 0;
          if (a.id === SELF || INTERNAL.indexOf(a.id) >= 0 || seen[a.id] || !a.name || (!primary && !stream && (!a.show || !consumer))) return;
          if (!primary && /(?:service|worker|preview|promotion|plugin|launcher|test|sdk|^ep[ -]|factory|daemon)/i.test(a.name + ' ' + a.id)) return;
          if (/-dummy$/.test(a.id) || a.id === 'com.samsung.tv.cobalt-yt') return;
          seen[a.id] = true;
          result.push({ appId: a.id, name: a.name, brand: known[a.id] || EXTRA_BRANDS[a.id] || '', icon: a.iconPath || '', rank: primary ? Object.keys(IDS).indexOf(known[a.id]) : (stream ? 20 : 30) });
        });
        result.sort(function (a, b) { return a.rank - b.rank || a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });
        finish(null, result);
      }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  window.FrameDevice = { launch: launch, launchApp: launchApp, liveTv: liveTv, art: art, home: home, settings: settings, input: input, previewInput: previewInput, closePreview: closePreview, apps: apps };
}());
