
# Audio Plugin

The Blits Audio Plugin allows developers to integrate audio playback into their Blits applications. This plugin provides a simple API for preloading, playing, controlling, and managing audio tracks, including managing volume, playback rate (pitch), and other settings.

**Note:** When testing or developing on Chrome, audio may not start immediately due to browser restrictions on `AudioContext`. You might see the following error:
`The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page. https://goo.gl/7K7WLu`. This issue occurs on desktop during development but is **not** an issue on Smart TVs, STBs, or Game Consoles. Once you interact with the application (e.g., click or press a key), the error will go away, and sound playback will function properly.

## Registering the Plugin

The Audio Plugin is not included by default and needs to be explicitly registered before usage. This makes the plugin _tree-shakable_, meaning if audio is not required, it won't be part of the final app bundle.

To register the plugin, you should import and register it before calling the `Blits.Launch()` method, as shown in the example below:

```js
// index.js

import Blits from '@lightningjs/blits'
// import the audio plugin
import { audio } from '@lightningjs/blits/plugins'

import App from './App.js'

// Register the audio plugin with optional preload settings
Blits.Plugin(audio, {
  preload: {
    background: '/assets/audio/background.mp3',
    jump: '/assets/audio/jump.mp3',
  },
})

Blits.Launch(App, 'app', {
  // launch settings
})
```

The Audio Plugin can accept an optional `preload` configuration, which allows you to preload audio files during initialization. These files are stored in an internal library for easy access during gameplay.

## Playing Audio Tracks

Once the plugin is registered, you can play audio tracks either from the preloaded library or from a URL. Here’s an example of how to use it inside a Blits Component:

```js
Blits.Component('MyComponent', {
  hooks: {
    ready() {
      // Play a preloaded track and get a track controller
      const bgMusic = this.$audio.playTrack('background', { volume: 0.5 }, 'bg-music')

      // Play a track from URL and get its controller
      const effect = this.$audio.playUrl('/assets/audio/victory.mp3', { volume: 0.8 })
    },
  },
})
```

The `playTrack()` method allows you to play an audio track from the preloaded library, while `playUrl()` allows you to play a track from a specified URL. Both methods return a track controller object.

### Track Controller Methods:
- `pause()`: Pauses the track.
- `resume()`: Resumes the paused track.
- `stop()`: Stops the track and removes it from the active list.
- `setVolume(volume)`: Adjusts the playback volume for the track.

### Example Usage of Track Controller:
```js
Blits.Component('MyComponent', {
  hooks: {
    ready() {
      const bgMusic = this.$audio.playTrack('background', { volume: 0.5 }, 'bg-music')

      // Pause, resume, and set volume on the track
      bgMusic.pause()
      bgMusic.resume()
      bgMusic.setVolume(0.8)
      bgMusic.stop()
    },
  },
})
```

## Preloading Audio Files

The most efficient way to manage audio in your app is to preload audio files. The Audio Plugin supports preloading via the `preloadTracks()` method. You can pass in an object where each key is the track name, and each value is the URL of the audio file.

```js
Blits.Component('MyComponent', {
  hooks: {
    init() {
      this.$audio.preload({
        jump: '/assets/audio/jump.mp3',
        hit: '/assets/audio/hit.mp3',
      })
    },
  },
})
```

Preloaded audio files are stored in an internal library, which you can reference when calling `playTrack()`.

## Removing Preloaded Audio Tracks

In some cases, you might want to remove a preloaded audio track from the library, freeing up memory or resources. You can do this using the `removeTrack()` method:

```js
Blits.Component('MyComponent', {
  input: {
    removeJumpTrack() {
      // Remove the 'jump' track from the preloaded library
      this.$audio.removeTrack('jump')
    },
  },
})
```

The `removeTrack(key)` method deletes the specified track from the internal `tracks` object, preventing further access to it.

## Error Handling

In cases where the `AudioContext` cannot be instantiated (e.g., due to browser limitations or disabled audio features), the Audio Plugin will automatically disable itself, preventing errors. If the `AudioContext` fails to initialize, an error message will be logged, and audio-related methods will return early without throwing additional errors.

You can check whether audio is available via the `audioEnabled` property:

```js
Blits.Component('MyComponent', {
  hooks: {
    ready() {
      if (!this.$audio.audioEnabled) {
        console.warn('Audio is disabled on this platform.')
      }
    },
  },
})
```

This ensures that your app continues to function even if audio features are not supported or available.

## Public API

The Audio Plugin provides the following methods and properties:

- `playTrack(key, { volume, pitch }, trackId)`: Plays a preloaded audio track and returns a track controller.
- `playUrl(url, { volume, pitch }, trackId)`: Plays an audio track from a URL and returns a track controller.
- `pause()`: Pauses the current audio track.
- `resume()`: Resumes the current audio track.
- `stop(trackId)`: Stops a specific audio track by its ID.
- `stopAll()`: Stops all currently playing audio tracks.
- `setVolume(trackId, volume)`: Sets the volume for a specific track by its ID.
- `preload(tracks)`: Preloads a set of audio tracks into the internal library.
- `removeTrack(key)`: Removes a preloaded track from the library.
- `destroy()`: Destroys the audio context and stops all tracks.
- `getActiveTracks`: Return a list of active track IDs
- `getActiveTrackById(trackId)`: Get an active track by its ID, returns `null` if not found (or stopped).
- `get audioEnabled`: Returns `true` if the `AudioContext` is available and audio is enabled.

## Destroying the Plugin

When you're done with the audio functionality, you can clean up the plugin and close the `AudioContext` by calling the `destroy()` method. This is especially useful when you no longer need audio in your application:

```js
Blits.Component('MyComponent', {
  hooks: {
    exit() {
      this.$audio.destroy()
    },
  },
})
```
