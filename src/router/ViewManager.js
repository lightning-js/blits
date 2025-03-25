export default class ViewManager {
  constructor() {
    // Initializes the ViewManager with a Map to store page instances
    // and a counter to keep track of the current entry.
    this.store = new Map()
    this.counter = 0
    this.createEntry()
  }

  createEntry() {
    // Creates a new entry in the store by incrementing the counter
    // and initializing the entry with a null value.
    this.counter++
    this.store.set(this.counter, null)
  }

  setView(obj) {
    // Sets the view object for the current entry in the store
    this.store.set(this.counter, obj)
  }

  getView() {
    // Retrieves the view object for the current entry in the store.
    return this.store.get(this.counter)
  }

  removeView() {
    // Removes the current entry from the store by deleting the entry
    // associated with the current counter and then decrements the counter.
    this.store.delete(this.counter)
    this.counter--
  }

  size() {
    // Returns the current number of entries in the store
    return this.counter
  }
}
