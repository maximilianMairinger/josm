import { merge } from "webpack-merge"
import commonMod from "./rollup.node.common.config.mjs"


export default merge(commonMod, {
  input: 'app/src/josm.ts',
  output: {
    file: 'dist/cjs/josm.js',
    format: 'cjs'
  },
})