import Blits from '@lightningjs/blits'

import Home from './pages/Home.js'

export default Blits.Application({
  template: `
    <Element>
      <RouterView />
    </Element>
  `,
  routes: [{ path: '/', component: Home }],
})
