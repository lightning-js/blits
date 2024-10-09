import Blits from '@lightningjs/blits'

import Loader from '../components/Loader.js'

export default Blits.Component('Home', {
  components: {
    Loader,
  },
  template: `
    <Element w="1920" h="1080" color="#1e293b">
      <Element src="assets/logo.png" w="200" h="200" x="860" y="320" :effects="[$shader('radius', {radius: 12})]" />
      <Loader x="880" y="600" />
    </Element>
  `,
})
