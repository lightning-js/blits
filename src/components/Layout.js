import Component from '../component.js'

export default () => {
  return Component('Layout', {
    template: `
      <Slot ref="slot" />
    `,
    props: [
      'direction',
      {
        key: 'gap',
        default: 0,
      },
    ],
    hooks: {
      ready() {
        this.___layout()
      },
    },
    methods: {
      // todo: review naming
      ___layout() {
        let offset = 0

        this.select('slot').children.forEach((el) => {
          el.set(this.direction === 'vertical' ? 'y' : 'x', offset)
          // todo: grab width from interface, not directly from node
          offset +=
            (el.node[this.direction === 'vertical' ? 'height' : 'width'] || 0) + (this.gap || 0)
        })
      },
    },
  })
}
