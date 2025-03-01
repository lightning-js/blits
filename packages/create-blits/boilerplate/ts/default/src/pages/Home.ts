import Blits from '@lightningjs/blits'

import Loader from '../components/Loader'

const colors = ['#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa']

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
        <Loader :x="1920 / 2" mount="{x: 0.5}" y="600" w="160" :alpha.transition="$loaderAlpha" :loaderColor="$color" />
        <Element y="600" :alpha.transition="$textAlpha">
          <Text size="80" align="center" maxwidth="1920">Hello!</Text>
          <Text
            size="50"
            align="center"
            y="120"
            :x="1920/2"
            maxwidth="500"
            lineheight="64"
            mount="{x: 0.5}"
            color="#ffffffaa"
            content="Let's get started with Lightning 3 & Blits"
          />
        </Element>
      </Element>
    </Element>`,
  state() {
    return {
      /**
       * Y-position of the entire page contents
       */
      y: 0 as number,
      /**
       * X-position of the logo, used to create slide in transition
       */
      x: -1000 as number,
      /**
       * Rotation of the logo, used to create a spinning transition
       */
      rotation: 0 as number,
      /**
       * Scale of the logo, used to create a zoom-in / zoom-out transition
       */
      scale: 1 as number,
      /**
       * Alpha of the loader component, used to create a fade-in / fade-out transition
       */
      loaderAlpha: 0 as number,
      /**
       * Alpha of the text, used to create a fade-in transition
       */
      textAlpha: 0 as number,
      /**
       * Color passed into the loader component
       */
      color: '' as string,
    }
  },
  hooks: {
    ready() {
      this.rotateColors(200)

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
      }, 6000)
    },
  },
  methods: {
    /**
     * Method to rotate the colors of the loader
     */
    rotateColors(interval: number): void {
      let i = 0
      this.$setInterval(() => {
        i++
        if (i >= colors.length) i = 0
        this.color = colors[i]
      }, interval)
    },
  },
})
