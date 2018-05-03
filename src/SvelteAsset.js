const { compile, preprocess } = require('svelte');
const { Asset } = require('parcel-bundler');

class SvelteAsset extends Asset {
  constructor(name, pkg, options) {
    super(name, pkg, options);
    this.type = 'js';
  }

  async parse(inputCode) {
    let svelteOptions = {
      compilerOptions: {
        generate: 'dom',
        format: 'cjs',
        store: true,
        filename: this.relativeName,
        css: false
      },
      preprocess: undefined
    };

    const customConfig = await this.getConfig(['.svelterc', 'svelte.config.js', 'package.json']);
    if (customConfig) {
      svelteOptions = Object.assign(svelteOptions, customConfig.svelte || customConfig);
    }

    if (svelteOptions.preprocess) {
      const preprocessed = await preprocess(inputCode, svelteOptions.preprocess);
      inputCode = preprocessed.toString();
    }

    return compile(inputCode, svelteOptions.compilerOptions);
  }

  async generate() {
    const { map, code } = this.ast.js;
    const css = this.ast.css.code;

    if (this.options.sourceMaps) {
      map.sources = [this.relativeName];
      map.sourcesContent = [this.contents];
    }

    let parts = [
      {
        type: 'js',
        value: code,
        sourceMap: this.options.sourceMaps ? map : undefined
      }
    ];

    if (css) {
      parts.push({
        type: 'css',
        value: css
      });
    }

    return parts;
  }
}

module.exports = SvelteAsset;
