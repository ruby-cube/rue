#### [goto: src](https://github.com/ruby-cube/rue/tree/main/packages/archer)
[@rue](https://github.com/ruby-cube/rue)  &nbsp;&nbsp;|&nbsp; &nbsp;  [planify](https://github.com/ruby-cube/rue/tree/main/packages/planify#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp; thread  &nbsp;&nbsp;|&nbsp; &nbsp; pecherie  &nbsp;&nbsp;|&nbsp; &nbsp; [archer](https://github.com/ruby-cube/rue/tree/main/packages/archer#goto-src)
# Archer 🏹

<aside>
⚠️ Experimental: Archer is a work-in-progress, not well-tested, with a volatile API. Look and play, but definitely don’t use…
</aside>
</br>
</br>

## Overview

Archer is a system for sending and receiving targeted messages/commands across scopes. Whereas Pêcherie’s listeners collects handlers to be run at a particular point in a process, Archer’s message senders request a *specific* callback to be run. 

<br/>

## Installation

```bash
(coming soon ...)
```
</br>

## Table of Contents

- Archer API
- Basic Usage
- Use Case
- Targeted Listening
</br>

## Archer API

`defineMessage(config)` 

`send(MESSAGE, {to: targetID }, data)` 

`heed(MESSAGE, targetID, callback)`

</br>

## `defineMessage(config)`

### Syntax

```tsx
const MESSAGE = defineMessage(config)
         |                      |
    MessageConfig             Config
```

### Type Definitions

```tsx
type Config = {
    message?: string | undefined;
    targetID?: unknown;
    data?: any, 
    onceAsDefault?: true, 
    dataAsArg?: true;
    reply?: () => { 
        state: ReplyState, // { [key: string]: any };
        methods: ReplyMethods // { [key: string]: (...args: any[]) => void } 
    };
}
type MessageConfig = Config;
```

See Hook Configuration for info on configuration values.

</br>

## `send(MESSAGE, {to: targetID }, data)`

### Syntax

```tsx
const reply = send(MESSAGE, { to: targetID }, data)
       |              |               |         |
      Reply     MessageConfig      TargetID   Data/Context
```

### Type Definitions

```tsx
type Reply = ReplyState | void;
type TargetID = any;
type Data = any;
```
</br>

## `heed(MESSAGE, targetID, handler)`

 Called by the receiver. Defines how to handle the message.

### Syntax

```tsx
heed(MESSAGE, targetID, handler)
        |        |         |
MessageConfig  TargetID  Handler
```

### Type Definitions

```tsx
type TargetID = any;
type Handler = (data: Data) => any;
```
</br>

## Basic Usage

```tsx

// define the message in a shared dependency or in the emitter module
const HIDE_ITEM = defineMessage({
    message: "hide-item",
    targetID: $type as Object 
});

// emitter module
send(HIDE_ITEM, { to: item });
```

```tsx
// listener module
heed(HIDE_ITEM, item, () => {
    // mutate local state to hide the item
});
```
</br>

## Use Case

As with all of the emitters and listeners in this repo, message passing via an archer is unnecessary if the sender and receiver are declared in the same scope. Simple function declaration and invocation will suffice:

```tsx
// simple invocation

function hideItem() {
    // do work to hide item
}

function reButtonClick() {
    // do some other work
    hideItem();
}
```

Message passing becomes useful when you are working across scopes. For example, let’s say you have a shared function that mutates the state of multiple components. Without message passing, you would allow the shared function to mutate the component’s local state by passing in a callback function like so:

```tsx
// a shared function

function hideItems(items, hideItem){ // pass in the method
    for (const item of items) {
        hideItem(item);
    }
}
```

However, this can be complicated if the event handler that calls `hideItems` is registered in a component different from the component’s whose state needs to be mutated. This is where Archer comes in handy.

```tsx
// shared dependency 
// (or pass HIDE_ITEM to components via dependency injection)

const HIDE_ITEM = defineMessage({
    message: "hide-item",
    targetID: $type as Object,
    data: $type as { fade: boolean },
    dataAsArg: true
});
```

```jsx
// component A

// script
function hideItems(){
    for (const item of items) {
        send(HIDE_ITEM, { to: item }, { fade: true })
    }
}

// template
<div @click="hideItems">CLICK ME</div>

```

```tsx
// component B

heed(HIDE_ITEM, item, (data) => {
   // hide item
})

```
</br>

## Targeted Listening

Archer’s heed function is a targeted listener for performance reasons. See [Planify: Targeted Listeners](https://www.notion.so/Planify-8394600940b34c8ca76c4eca84eb5496) for more information on targeted listeners and how to generate deterministic target ids.

<br/>
<br/>

[[top]](https://github.com/ruby-cube/rue/tree/main/packages/planify#goto-src)

© 2023 - present [Ruby Y Wang](https://github.com/ruby-cube)