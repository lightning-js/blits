import Component from '../component.js'

export default () =>
  Component('Circle', {
    template: `
      <Element :color="$color" :w="$size" :h="$size" :effects="[$shader('radius', {radius: $radius})]"></Element>
    `,
    props: [{ key: 'size', default: 40 }, 'color'],
    computed: {
      radius() {
        return this.size / 2
      },
    },
  })
