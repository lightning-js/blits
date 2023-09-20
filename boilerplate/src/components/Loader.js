import Blits from '@lightningjs/blits'

export default Blits.Component('Loading', {
  template: `
    <Element>
      <Circle size="40" color="#94a3b8" :alpha.transition="{value: $alpha, delay: 200}" />
      <Circle size="40" color="#94a3b8" x="60" :alpha.transition="{value: $alpha, delay: 300}" />
      <Circle size="40" color="#94a3b8" x="120" :alpha.transition="{value: $alpha, delay: 400}" />
    </Element>
  `,
  state() {
    return {
      alpha: 0,
    }
  },
  hooks: {
    ready() {
      this.$setInterval(() => {
        this.alpha = this.alpha === 1 ? 0 : 1
      }, 800)
    },
  },
})
