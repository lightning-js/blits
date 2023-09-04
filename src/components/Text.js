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
        :width="$w"
        textAlign="$textalign"
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
      'textalign',
      'w',
    ],
    computed: {
      text() {
        return this.slotcontent || this.content || ''
      },
    },
    hooks: {},
  })
