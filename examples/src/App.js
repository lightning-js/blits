import Blits from '@lightningjs/blits'

import StaticItems from './pages/StaticItems'
import Shaders from './pages/Shaders'

export default Blits.Application({
  template: `
    <Element w="1920" h="1080">
      <RouterView />
    </Element>
  `,
  state() {
    return {
      counter: 0,
      testPaths: ['/', '/shaders'],
    }
  },
  hooks: {
    init() {
      this.totalTests = this.testPaths.length
      this.$listen('move-to-next', () => {
        this.counter++
        if (this.counter >= this.totalTests) {
          window.doneTests()
        } else {
          // navigate to next route
          this.$router.to(this.testPaths[this.counter])
        }
      })
    },
  },
  routes: [
    { path: '/', component: StaticItems },
    { path: '/shaders', component: Shaders },
  ],
})
