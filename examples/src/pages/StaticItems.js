import Blits from '@lightningjs/blits'

export default Blits.Component('CreateItemsIncrementally', {
  template: `
    <Element w="1920" h="1080" color="$bg">
      <Element
        :for="item in $items"
        w="$item.width"
        h="$item.height"
        x="$item.x"
        y="$item.y"
        color="$item.color"
        :effects="[{type: 'radius', props: {radius: $item.radius}}]"
        key="$item.key"
      />
    </Element>
  `,
  state() {
    return {
      bg: '#000',
      items: [],
    }
  },
  hooks: {
    init() {
      let data = []
      const colors = ['#1a1aff', '#cc0066', '#00802b', '#6600cc', '#b35900', '#004d99', '#800000']
      const margin = 50
      const spacing = 20
      const rectWidth = 286
      const rectHeight = 313
      const columns = 6

      for (let i = 0; i < 18; i++) {
        const row = Math.floor(i / columns)
        const col = i % columns
        data.push({
          key: 'block' + i,
          width: rectWidth,
          height: rectHeight,
          x: margin + col * (rectWidth + spacing),
          y: margin + row * (rectHeight + spacing),
          radius: 20,
          color: colors[i % colors.length],
        })
      }
      this.items = data
    },
    async ready() {
      this.$setTimeout(async () => {
        await window.snapshot('static-blocks', {})
        this.$emit('move-to-next')
      }, 500)
    },
  },
})
