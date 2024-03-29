Blits.Shader('RoundedTriangle', {
  vertex: '',
  fragment: '',
  uniforms,
})

import RoundedTriangle from './RoundedTriangle.js'
Blits.Component('RandomComp', {
  template: `
    <Element shader='RoundedTriangle'/>
  `,
  shaders: { RoundedTriangle },
})
