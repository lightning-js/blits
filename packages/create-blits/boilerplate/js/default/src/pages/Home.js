import Blits from '@lightningjs/blits'

import Loader from '../components/Loader.js'

export default Blits.Component('Home', {
  components: {
    Loader,
  },
  template: `
    <Element w="1920" h="1080" color="#1e293b">
      <Element :y.transition="$y">
        <Element
          src="assets/logo.png"
          w="200"
          h="200"
          :scale.transition="{value: $scale, duration: 500}"
          :rotation.transition="{value: $rotation, duration: 800}"
          :x.transition="{value: $x, delay: 200, duration: 1200, easing: 'cubic-bezier(1,-0.64,.39,1.44)'}"
          mount="{x: 0.5}"
          y="320"
          :effects="[$shader('radius', {radius: 8})]"
        />
        <Loader :x="1920 / 2" mount="{x: 0.5}" y="600" w="160" :alpha.transition="$loaderAlpha" />
        <Element y="600" :alpha.transition="$textAlpha">
          <Text size="80" align="center" wordwrap="1920">Hello!</Text>
          <Text
            size="50"
            align="center"
            y="120"
            :x="1920/2"
            wordwrap="500"
            lineheight="64"
            mount="{x: 0.5}"
            color="#ffffffaa"
            content="Let's get started with Lightning 3 & Blits"
          />
        </Element>
      </Element>
    </Element>
  `,
  state() {
    return {
      y: 0,
      x: -1000,
      rotation: 0,
      scale: 1,
      loaderAlpha: 0,
      textAlpha: 0.00001,
    }
  },
  hooks: {
    ready() {
      this.loaderAlpha = 1
      this.x = 1920 / 2

      this.$setTimeout(() => {
        this.rotation = 720
        this.scale = 1.5
      }, 3000)

      this.$setTimeout(() => {
        this.scale = 1
      }, 3000 + 300)

      this.$setTimeout(() => {
        this.y = -60
        this.loaderAlpha = 0
        this.scale = 1
        this.textAlpha = 1
      }, 3800)
    },
  },
})
