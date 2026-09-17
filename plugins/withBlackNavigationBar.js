const { withAndroidStyles, withMainActivity, AndroidConfig } = require('expo/config-plugins');

function setBlackNavigationBar(styles) {
  const groups = Array.isArray(styles.resources?.style)
    ? styles.resources.style
    : [{ $: { name: AndroidConfig.Styles.getAppThemeGroup().name } }];
  for (const group of groups) {
    const parent = { name: group?.$?.name };
    if (!parent.name) {
      continue;
    }
    styles = AndroidConfig.Styles.assignStylesValue(styles, {
      add: true,
      parent,
      name: 'android:navigationBarColor',
      value: '#000000',
    });
    styles = AndroidConfig.Styles.assignStylesValue(styles, {
      add: true,
      parent,
      name: 'android:windowLightNavigationBar',
      value: 'false',
    });
    styles = AndroidConfig.Styles.assignStylesValue(styles, {
      add: true,
      parent,
      name: 'android:enforceNavigationBarContrast',
      value: 'false',
      targetApi: '29',
    });
    styles = AndroidConfig.Styles.assignStylesValue(styles, {
      add: true,
      parent,
      name: 'expoEnforceNavigationBarContrast',
      value: 'false',
    });
  }
  return styles;
}

const NAV_BAR_COLOR_MARKER = 'window?.navigationBarColor = android.graphics.Color.BLACK';

function injectNavBarColorOverride(mainActivity) {
  if (mainActivity.contents.includes(NAV_BAR_COLOR_MARKER)) {
    return mainActivity;
  }
  const injected = mainActivity.contents.replace(
    /(super\.onCreate\((?:null|savedInstanceState)\))/,
    `$1\n    window?.navigationBarColor = android.graphics.Color.BLACK`,
  );
  if (injected === mainActivity.contents) {
    throw new Error(
      'withBlackNavigationBar: super.onCreate non trovato in MainActivity.kt (il template RN è cambiato?)',
    );
  }
  mainActivity.contents = injected;
  return mainActivity;
}

module.exports = function withBlackNavigationBar(config) {
  config = withAndroidStyles(config, (config) => {
    config.modResults = setBlackNavigationBar(config.modResults);
    return config;
  });
  config = withMainActivity(config, (config) => {
    config.modResults = injectNavBarColorOverride(config.modResults);
    return config;
  });
  return config;
};
