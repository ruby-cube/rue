#### [goto: src](#)
[@rue](https://github.com/ruby-cube/rue#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp;  [planify](https://github.com/ruby-cube/rue/tree/main/packages/planify#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp; **thread**  &nbsp;&nbsp;|&nbsp; &nbsp; [pecherie](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp; [archer](https://github.com/ruby-cube/rue/tree/main/packages/archer#goto-src)
# Thread ⏳

<aside>
⚠️ <b>Experimental:</b> Thread is a work-in-progress, not well-tested nor optimized, with a volatile API. Look and play, but definitely don’t use…
</aside>

<p align="right"><a href="#">[src]</a></p>

## Overview

Thread provides planified versions of schedulers and event listeners from Web APIs.

<p align="right"><a href="#">[src]</a></p>

## Installation

```bash
(coming soon ...)
```
<p align="right"><a href="#">[src]</a></p>

## Table of Contents

- [Thread API](#thread-api)
- [Event Listeners API](#event-listeners-api)
- [Naming Conventions](#naming-conventions)
<p align="right"><a href="#goto-src">[top]</a></p>

## Thread API

Planified schedulers return a `ScheduledOp`, which is essentially a cancellable `Promise`. The only option they take is a `unlessCanceled` cancellation scheduler.

[`addPS(callback)`](#addpscallback) 

[`queueTask(callback, options?)`](#queuetaskcallback-options)

[`beforeScreenPaint(callback, options?)`](#beforescreenpaintcallback-options)

[`onTimeout(delay, callback, options?)`](#ontimeoutdelay-callback-options)

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `addPS(callback)` 

an alias for `queueMicrotask` from browser API. Here, microtasks are conceptualized as postscripts to event loop tasks.

### Usage

```js
addPS(() => {
    // code that will run after the original task/handlers 
    // and previously queued microtasks finish running
    // but before the next event loop task
});
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `queueTask(callback, options?)`

planified `setImmediate` (as implemented by https://github.com/yuzujs/setImmediate). It essentially queues a task in the event loop’s task queue.

### Usage

```js
queueTask(() => {
    // code that will run after any previously 
    // queued tasks/events in the event loop
    // (unless canceled by the action-completed hook)
}, { unlessCanceled: onActionCompleted });
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `beforeScreenPaint(callback, options?)`

planified `requestAnimationFrame`, which schedules code to run before the next screen paint.

### Usage

```js
beforeScreenPaint(() => {
    // code that will after any previously queued rAF callbacks
    // and before the next screen paint
});
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `onTimeout(delay, callback, options?)`

planified `setTimeout`

### Usage

```js
onTimeout(500, () => {
    // code that will run after 500ms
});
```

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Event Listeners API

The Event Listeners API provides planified browser event listeners with the `useEventListener` function. `useEventListener` returns the requested event listener if it already exists in the app, otherwise, it creates the listener and stores it for future access to avoid redundant instances.

<p align="right"><a href="#table-of-contents">[toc]</a></p>

### Usage

```js
const onMouseDown = useEventListener("mousedown");

onMouseDown(element, () => {
    // handle mouse down
});
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Naming Conventions

People often name event handlers using the prefix “on-” followed by the event name, e.g. `onMouseUp`, as a concise alternative to the prefix “handle-”. When using Planify listeners, it’s helpful to distinguish handlers from listeners with a different naming convention for better clarity. In my own codebase, I use the prefix “re-”, as in “regarding” or “replying to” or “RE: Your email”, e.g. `reMouseUp`. 

```js
// handler
function reMouseDown(event) {
    // handle mouse down...
    // if this case, do this
    // if that case, do that

    // listener
    onMouseUp(document, () => {
       // handle mouse up
    }, { once: true });
}
```

Template:

```ts
<div @mousedown="reMouseDown">{{ item }}</div>
```

Of course if a handler performs a specific action, it would make sense to simply name it that, e.g. `incrementCount`

<p align="right"><a href="#goto-src">[top]</a></p>

© 2023 - present [Ruby Y Wang](https://github.com/ruby-cube)
