import Component from '../component.js'

export default () =>
  Component('Text', {
    template: `
      <Element
        textnode="true"
        :text="$text"
        fontFamily="$font"
        :fontSize="$size"
        :color="$color"
        :style="$style"
        :weight="$weight"
        letterSpacing="$letterspacing"
        stretch="$stretch"
        :w="$w"
        contain="width"
        :textAlign="$align"
      />`,
    props: [
      'content',
      {
        key: 'font',
        default: 'TedNext',
      },
      {
        key: 'size',
        cast: Number,
        default: 32,
      },
      'style',
      'color',
      'weight',
      'letterspacing',
      'stretch',
      'align',
      'w',
    ],
    computed: {
      text() {
        return this.slotcontent || this.content || ''
      },
    },
    hooks: {},
  })
