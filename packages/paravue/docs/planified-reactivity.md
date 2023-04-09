# Planified Reactivity

<aside>
⚠️ Experimental: A work-in-progress, not well-tested, with a volatile API. Look and play, but definitely don’t use…

</aside>

### Overview

For rare use cases, where maybe you want to pass `watch` as a cleanup scheduler to a planified listener or you want to specify when to stop computing a value. Or you are working outside of a Vue component and want auto-cleanup using the Scene API. See Planify for an explanation of the Planify system.

### The API

`onChange(accessor, handler, options)`

`compute(computation, options)`

## `onChange(accessor, handler, options)`

A planified version of `watch`. `onChange` differs from the `watch` in two ways: 

- instead of returning an `unwatch` function, it returns an `ActiveListener` that can be stopped
- it can take in the same listener options as other Planify listeners, therefore can be configured to be a one-time listener

### Usage

```jsx
onChange(() => item.bullet, (value) => {
		// do stuff
}, { until: docClosed })
```

## `compute(computation, options)`

A planified version of `computed`.  `compute` differs from `computed` simply in that it can take in an `until` option configuration.

### Usage

```tsx
const fullName = compute(() => firstName.value + " " + lastName.value, { 
		until: sessionDone 
})
```

### Auto-cleanup With Scene API

As with all Planify listeners, auto-cleanup can be achieved using the Scene API

```jsx
import { beginScene } from "@rue/planify"

// ...

function initDrag(event){
    const el = event.target
	  beginScene((dragging) => {

		    const x = ref(0);
        const y = ref(0);
			  const position = compute(() => `${x.value}, ${y.value}`);

	      onMouseEnter(el, () => {
		        // do work
	      });
 
        onMouseLeave(el, () => {
	 	        // do work
	      });

    	  onMouseMove(document, () => {
		        // do work
	      });

    	  onMouseUp(document, () => {
		        // do work
		        dragging.end()  // stops all listeners registered during scene
	      })
    });
}
```

Because reactivity is implemented through getters and setters, reactive values must be stored as a property of an object rather than a variable.

while adding verbosity in places it didn’t previously exist 

Consistency across refs and reactives