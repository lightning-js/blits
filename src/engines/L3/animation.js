import {
  engine,
  animate,
  createAnimatable as engineAnimatable,
  createTimeline as engineTimeline,
  createTimer as engineTimer,
} from 'animejs'
import { stage, renderer } from './launch.js'
import symbols from '../../lib/symbols.js'
import Settings from '../../settings.js'
import { normalizeToEase } from '../../lib/animejs/easings.js'

const inspectorEnabled = Settings.get('inspector', false)

let globalActiveAnimationCount = 0

const init = () => {
  engine.useDefaultMainLoop = false
  renderer.on('frameTick', () => {
    engine.update()
    stage.activeAnimationCount = globalActiveAnimationCount
  })
}

const animateElementProp = (element, prop, value, transitionSettings) => {
  let ease
  let duration
  let delay
  const updateFns = []

  if (transitionSettings !== undefined && typeof transitionSettings === 'object') {
    ease = transitionSettings.ease || normalizeToEase(transitionSettings.easing)
    duration = transitionSettings.duration || 300
    delay = transitionSettings.delay || 0
  }
  if (transitionSettings === undefined) {
    ease = 'linear'
    duration = 300
    delay = 0
  }

  const animation = animate(element.node, {
    [prop]: value,
    ease: ease,
    duration: duration,
    delay: delay,
    autoplay: false,
  })

  applyCallbacksWithElement(element, animation, prop, transitionSettings)

  animation.play()
  element.scheduledTransitions[prop] = {
    animation,
    cancel() {
      if (this.animation.completed) return
      this.animation.cancel()
      this.animation.onComplete(true)
    },
    destroy: () => {
      updateFns.length = 0
    },
  }
}

const createAnimatableElement = (element, props, keys) => {
  const animatableProps = {}
  let i = 0
  for (i = keys.length - 1; i >= 0; i--) {
    const key = keys[i]
    const prop = props[key].transition
    if (prop.delay > 0) {
      //remove key from keys so that it is not added to the animatable object
      keys.splice(i, 1)
      continue
    }
    animatableProps[key] = {
      duration: prop.duration || 300,
      ease: prop.ease || normalizeToEase(prop.easing),
    }
  }

  const animatable = engineAnimatable(element.node, animatableProps)
  const animations = animatable.animations
  for (i = 0; i < keys.length; i++) {
    const key = keys[i]
    applyCallbacksWithElement(element, animations[key], key, props[key].transition)
  }
  return animatable
}

const applyCallbacksWithElement = (element, animation, key, settings) => {
  const updateFns = []
  animation.onBegin = () => {
    if (element.eol === true) return
    if (element.component !== undefined) {
      element.component[symbols.activeAnimations].set(animation.id, animation)
    }

    globalActiveAnimationCount++
    element.activeAnimationCount++
    if (inspectorEnabled === true) {
      element.setInspectorMetadata({ 'blits-isTransitioning': true })
    }
  }
  animation.onComplete = (canceled = false) => {
    if (element.component !== undefined) {
      element.component[symbols.activeAnimations].delete(animation.id)
    }
    globalActiveAnimationCount--
    element.activeAnimationCount--
    if (canceled === true || element.eol) return
    if (settings.end && typeof settings.end === 'function') {
      settings.end.call(element.component, element, settings, element.node[key])
    }
    if (inspectorEnabled === true) {
      element.setInspectorMetadata({
        'blits-isTransitioning': element.activeAnimationCount > 0,
      })
    }
  }
  // if the element is a layout, trigger a layout update on the parent
  if (element.config.parent.props && element.config.parent.props.__layout === true) {
    //push into updateFns so that it is called on every frame of the animation
    updateFns.push(() => {
      element.config.parent.triggerLayout(element.config.parent.props)
    })
  }

  if (settings.progress !== undefined && typeof settings.progress === 'function') {
    let prevProgress = 0
    updateFns.push((animation) => {
      settings.progress.call(element.component, element, key, animation.progress, prevProgress)
      prevProgress = animation.progress
    })
  }

  if (updateFns.length > 0) {
    animation.onUpdate = (animation) => {
      if (element.eol === true || !element.config) return
      for (let i = 0; i < updateFns.length; i++) {
        updateFns[i](animation)
      }
    }
  }
}

const applyCallbacks = (activeAnimations, animationType, props) => {
  animationType.onBegin = () => {
    globalActiveAnimationCount++
    activeAnimations.set(animationType.id, animationType)
    if (props.onBegin && typeof props.onBegin === 'function') {
      props.onBegin()
    }
  }
  animationType.onComplete = (canceled = false) => {
    globalActiveAnimationCount--
    activeAnimations.delete(animationType.id)
    if (props.onComplete && typeof props.onComplete === 'function') {
      props.onComplete(canceled)
    }
  }
}

const createAnimatable = (activeAnimations, targets, props) => {
  const animatable = engineAnimatable(targets, props)
  const animations = animatable.animations
  for (const key in animations) {
    applyCallbacks(activeAnimations, animations[key], props)
  }
  return animatable
}

const createAnimation = (activeAnimations, targets, props) => {
  const animation = animate(targets, props)
  applyCallbacks(activeAnimations, animation, props)
  return animation
}

const createTimer = (activeAnimations, props) => {
  const timer = engineTimer(props)
  applyCallbacks(activeAnimations, timer, props)
  return timer
}

const createTimeline = (activeAnimations, props) => {
  const timeline = engineTimeline(props)
  applyCallbacks(activeAnimations, timeline, props)
  return timeline
}

const cancelAnimations = (activeAnimations) => {
  for (const animation of activeAnimations.values()) {
    animation.cancel()
    globalActiveAnimationCount--
  }
  activeAnimations.clear()
}

/**
 * @typedef {Object} AnimationEngine
 * @property {function} init - Initializes the animation engine and sets up the main loop
 * @property {function} createAnimatable - Creates an animatable object for the given targets and properties
 * @property {function} createAnimatableElement - Creates an animatable object for a given element and its properties
 * @property {function} animateElementProp - Animates a specific property of an element with the given value and transition settings
 * @property {function} createAnimation - Creates an animation for the given targets and properties
 * @property {function} createTimer - Creates a timer with the given properties
 * @property {function} createTimeline - Creates a timeline with the given properties
 */
export default {
  init,
  createAnimatable,
  createAnimatableElement,
  animateElementProp,
  createAnimation,
  createTimer,
  createTimeline,
  cancelAnimations,
}
