import { $ } from 'execa'

/**
 * Detects the available container runtime (podman or docker).
 * @returns {Promise<string>} The name of the container runtime (`podman` or `docker`).
 * @throws {Error} If neither runtime is found.
 */
export async function detectContainerRuntime() {
  try {
    await $`podman -v`
    return 'podman'
  } catch {
    try {
      await $`docker -v`
      return 'docker'
    } catch {
      throw new Error('Neither podman nor docker is installed. Please install one of them.')
    }
  }
}
