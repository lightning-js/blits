import Component from '../component.js'

export default () =>
  Component('Image', {
    template: `
      <Element :imageSource="$imageSource" />`,
    props: ['src'],
    computed: {
      imageSource() {
        if (/^(?:https?:)?\/\//i.test(this.src)) {
          return this.src
        }
        return `${window.location.protocol}//${window.location.host}/${this.src}`
      },
    },
  })
