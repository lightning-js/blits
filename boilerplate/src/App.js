import Bolt from '@lightningjs/bolt'

import Home from './pages/Home.js'

export default Bolt.Application({
  template: `
    <Element>
      <RouterView />
    </Element>
   `,
  routes: [{ path: '/', component: Home }],
})
