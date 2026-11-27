# Working on Blits

Blits is an app development framework for Lightning 3, built for STBs, Smart TVs and other resource-constrained devices.

Performance comes first. Blits should also make the life of App developers easy, with an intuitive public API that keeps complexity inside the framework.

These guidelines apply to development of the Blits framework. App development documentation lives in `docs/`.

## Main guidelines

- Prioritise runtime performance, especially in frequently executed paths. Avoid speculative optimisations that make code harder to understand; optimise based on actual costs and constraints.
- Write readable, understandable code. Make the flow easy to follow and explain non-obvious optimisations.
- Use descriptive, intuitive names. Short names such as `i` are fine for loop indexes.
- Organise modules by responsibility and keep related logic together.
- Keep functions focused. Extract helpers when they clarify the code or avoid meaningful duplication, without fragmenting straightforward logic.
- Keep the runtime lightweight. Consider startup time, memory usage and bundle size when adding dependencies or features.
- Prefer existing dependencies and platform capabilities over introducing new dependencies.
- Treat existing public APIs and behaviour as contracts. Avoid breaking changes unless explicitly required, and consider backward compatibility when changing internal behaviour.
- Apply these guidelines to new and changed code. Keep changes focused and avoid unrelated cleanup.

## Coding patterns

- Use factory functions, plain objects and shared prototypes for framework objects. Don't introduce class-based hierarchies. Follow established patterns in the surrounding code. Don't introduce alternative abstractions or conventions without a clear reason.
- Use normal functions where component this is needed. Preserve the receiver when invoking callbacks, and don't change callback arguments or invocation timing unintentionally.
- Use `for` or `while` loops instead of `forEach`. Avoid chains of array methods when a single loop avoids intermediate arrays.
- Use `const` by default and `let` when reassignment is needed. Don't use `var`.
- Use strict comparisons. Check explicitly for `false`, `null` or `undefined` when that is what you mean.
- Don't use optional chaining (`?.`) in framework code. It is allowed in helpers and the parser. Handle optional values with explicit checks or early returns, and access required properties directly.
- Use early returns to avoid unnecessary nesting.
- Do work once at build or setup time where possible, rather than repeating it on state changes or every frame.
- Avoid unnecessary objects, arrays and closures in frequently executed code. Reuse storage and cache repeated work where useful, with clear invalidation.
- Clean up timers, listeners, effects and other resources when their owner is destroyed.
- Use the symbol registry for internal component properties to avoid collisions with App code.

## Checking changes

- Add or update small, readable tests for changed behaviour, following the existing Tape tests alongside the code.
- Test meaningful behaviour. Keep setup and assertions easy to understand.
- Review existing tests affected by the change. Update or remove tests for behaviour that no longer applies, while preserving coverage of behaviour that still matters.
- Run the relevant tests and lint checks.
- Update documentation and type declarations when changing the public API.
