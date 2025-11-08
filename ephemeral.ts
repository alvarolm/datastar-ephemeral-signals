/**
 * Ephemeral Signals Plugin for Datastar
 *
 * This plugin provides an `@ephemeral` action to create temporary signals.
 * These are ideal for transient states, like notifications, alerts, or anything
 * that has a short lifespan.
 *
 * - generates a unique signal key with a configurable prefix
 * - stores the provided data at the root level (reactive via bracket notation)
 *
 * Setup:
 *   import * as datastar from './datastar.js'
 *   import { install } from './ephemeral.js'
 *   install(datastar)                           // defaults: prefix='eph_', timeout=0
 *   install(datastar, { prefix: 'temp_' })      // custom prefix
 *   install(datastar, { timeout: 3000 })        // default 3s timeout
 *   install(datastar, { prefix: 'err_', timeout: 5000 })  // both
 *
 * Examples:
 *   <script>let toast = null</script>
 *
 *   <button data-on:click="toast = @ephemeral({ msg: 'Hi' })">Create</button>
 *   <button data-on:click="toast = @ephemeral({ msg: 'Hi' }, { duration: 3000 })">Create (3s)</button>
 *   <button data-on:click="toast = @ephemeral({ msg: 'Hi' }, { duration: 5000, prefix: 'err_' })">Custom prefix</button>
 *   <button data-on:click="toast?.remove(); toast = null">Dismiss</button>
 *
 *   <div data-show="toast" data-text="$[toast?.id()].msg"></div>
 *
 *   <button data-on:click="@post('/api', { filterSignals: toast.filter() })">Send this</button>
 *   <button data-on:click="@post('/api', { filterSignals: toast.filterPrefix() })">Send all</button>
 */

import { action } from '@engine'
import { root } from '@engine/signals'
import type { ActionContext } from '@engine/types'

// Create a type-only definition for the engine parameter
type DatastarEngine = {
  action: typeof action
  root: typeof root
}


class EphemeralSignal {
  #key: string
  #root: Record<string, any>
  #timeoutId?: number

  constructor(
    key: string,
    rootRef: Record<string, any>,
    timeoutId: number | undefined
  ) {
    this.#key = key
    this.#root = rootRef
    this.#timeoutId = timeoutId
  }

  id(): string {
    return this.#key
  }

  remove(): boolean {
    console.log('root:', this.#root)

    // Clear timeout if it exists
    if (this.#timeoutId !== undefined) {
      clearTimeout(this.#timeoutId)
    }

    // Remove the signal from root
    if (this.#root[this.#key]) {
      delete this.#root[this.#key]
      return true
    }
    return false
  }
}

export function install(
  engine: DatastarEngine,
  options: { prefix?: string; timeout?: number } = {}
) {
  const { prefix: defaultPrefix = 'eph_', timeout: defaultTimeout = 0 } = options
  const { action, root } = engine

  // Create ephemeral signal action
  action({
    name: 'ephemeral',
    apply: (ctx: ActionContext, data: any = {}, options: { duration?: number; prefix?: string } = {}): EphemeralSignal => {
      const { duration, prefix: customPrefix } = options

      // Use custom prefix if provided, otherwise use default
      const prefix = customPrefix ?? defaultPrefix

      // Generate unique key with prefix
      const key = prefix + self.crypto.randomUUID().replace(/-/g, '')

      // Store the data at root level
      root[key] = data

      let timeoutId: number | undefined

      // Use provided duration, or fall back to defaultTimeout
      const effectiveDuration = duration !== undefined ? duration : defaultTimeout

      // If duration is positive, auto-remove after duration (in milliseconds)
      if (effectiveDuration > 0) {
        timeoutId = setTimeout(() => {
          if (root[key]) {
            delete root[key]
          }
        }, effectiveDuration)
      }

      // Return an EphemeralSignal instance
      return new EphemeralSignal(key, root, timeoutId)
    },
  })
}
