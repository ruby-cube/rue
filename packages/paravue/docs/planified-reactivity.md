[@rue](https://github.com/ruby-cube/rue)  &nbsp;&nbsp;|&nbsp; &nbsp;  paravue  &nbsp;&nbsp;|&nbsp; &nbsp; planified reactivity  &nbsp;&nbsp;|&nbsp; &nbsp; reactivity markers
# Planified Reactivity

<aside>
⚠️ <b>Experimental</b>: A work-in-progress, not well-tested, with a volatile API. Look and play, but definitely don’t use…
</aside>
<br/>
<br/>

## Overview

For rare use cases, where maybe you want to pass `watch` as a cleanup scheduler to a planified listener or you want to specify when to stop computing a value. Or you are working outside of a Vue component and want auto-cleanup using the Scene API. See Planify for an explanation of the Planify system.

<br/>

## Installation

```bash
(coming soon ...)
```
</br>

## The API

`onChange(accessor, handler, options)`

`compute(computation, options)`

<br/>

## `onChange(accessor, handler, options?)`

A planified version of `watch`. `onChange` differs from the `watch` in two ways: 

- instead of returning an `unwatch` function, it returns an `ActiveListener` that can be stopped
- it can take in the same listener options as other Planify listeners, therefore can be configured to be a one-time listener

### Usage

```jsx
onChange(() => item.bullet, (value) => {
    // do stuff
}, { until: docClosed })
```
<br/>

## `compute(computation, options?)`

A planified version of `computed`.  `compute` differs from `computed` simply in that it can take in an `until` option configuration.

### Usage

```tsx
const fullName = compute(() => firstName.value + " " + lastName.value, { 
    until: sessionDone 
})
```
<br/>

## Auto-cleanup With Scene API

Auto-cleanup can be achieved using the Scene API

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

<br/>
<br/>

[[top]](https://github.com/ruby-cube/rue/tree/main/packages/planify#goto-src)

© 2023 - present [Ruby Y Wang](https://github.com/ruby-cube)
