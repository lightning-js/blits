import Component from '../component.js'

export default () =>
  Component('Sprite', {
    template: `
      <Element w="$w" h="$h" :texture="$texture" />
    `,
    props: ['image', 'map', 'frame', 'w', 'h'],
    state() {
      return {
        spriteTexture: false,
      }
    },
    computed: {
      texture() {
        const options =
          'frames' in this.map
            ? { ...(this.map.defaults || {}), ...this.map.frames[this.frame] }
            : this.map[this.frame]

        if (this.spriteTexture && options) {
          return this.___renderer.makeTexture('SubTexture', {
            texture: this.spriteTexture,
            x: options.x,
            y: options.y,
            width: options.w,
            height: options.h,
          })
        }
      },
    },
    hooks: {
      render() {
        this.spriteTexture = this.___renderer.makeTexture('ImageTexture', {
          src: `${window.location.protocol}//${window.location.host}/${this.image}`,
        })
      },
    },
  })
