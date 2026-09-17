const { withAppBuildGradle } = require('@expo/config-plugins');

const DEBUG_SUFFIX_MARKER = 'applicationIdSuffix ".debug"';

module.exports = function withDebugApplicationIdSuffix(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes(DEBUG_SUFFIX_MARKER)) {
      return config;
    }
    let applied = false;
    const contents = config.modResults.contents.replace(
      /(^|\n)(\s*)debug \{\n(\s*signingConfig signingConfigs\.debug\n)/,
      (match, lead, indent, signLine) => {
        applied = true;
        const pad = /^\s*/.exec(signLine)[0];
        return lead + indent + 'debug {\n' + signLine + pad + DEBUG_SUFFIX_MARKER + '\n';
      }
    );
    if (!applied) {
      throw new Error(
        'withDebugApplicationIdSuffix: blocco `debug { signingConfig signingConfigs.debug }` non trovato in android/app/build.gradle (il template RN è cambiato?)'
      );
    }
    config.modResults.contents = contents;
    return config;
  });
};