# Blits - Lightning 3 App Development Framework

## Computed properties

So far we've learned how to utilize internal state variables and props passed by a parent in (the template of) our component.
We can even perform simple operations like `Math.max()` or `str.toUpperCase()` directly within an argument of the template.

However, sometimes it's more clear and more maintainable to abstract these operations into what we call _computed properties_.

Within the computed key of the Component configuration object, you can specify a set of functions. Each function name you define (`offset()` for example) becomes accessible as a computed property.

In your template, you can reference these computed properties by prefixing them with a dollar sign (e.g., `$offset`). In the rest of your app's code, you can access these computed properties (but not modify them) using `this.offset`.

Within a computed property, you can reference one or more state variables or props and return a value based on calculations or logical operations.

Whenever the value of any referenced variable changes, the computed property will automatically recalculate. If a computed property is referenced reactively in the template (i.e., prefixed with colons `:`), it will also trigger an automatic rerender of that portion of the template.

Computed properties are a powerful tool for enhancing the readability of your component code. By abstracting complex or frequently used calculations into computed properties, you can make your code (and especially your template) more concise and easier to understand.
