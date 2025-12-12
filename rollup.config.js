const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const postcss = require('rollup-plugin-postcss')

const plugins = [
    nodeResolve({
        ignoreGlobal: true
    }),
    commonjs({
        ignore: [],
        sourceMap: false,
    }),
    terser(),
]

module.exports = [
    {
        input: 'src/content_scripts/content.js',
        output: {
            format: 'iife',
            dir: 'dist/content_scripts',
            name: 'QrcodeHelper'
        },
        plugins: [
            ...plugins,
            postcss({
                extract: true,
                extensions: ['.less'],
                includes: ['styles/*.less'],
                use: ['less'],
                minimize: true
            })
        ],
        cache: true,
    },
    {
        input: 'src/background/service-worker.js',
        output: {
            format: 'iife',
            dir: 'dist/background',
            name: 'QrcodeHelper'
        },
        plugins
    }
];