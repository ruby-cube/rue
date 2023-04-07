# Planify 🪶

<aside>
⚠️ <b>Experimental:</b> Planify is a work-in-progress, not well-tested nor optimized, with a volatile API. Look and play, but definitely don’t use…

</aside>
<br/>
<br/>

## Overview & Motivation

When building complex applications with many interacting parts, event-driven programming enables loose-coupling, proper delegation of responsibilities, and extensibility of modules that are closed to modification, thus improving application maintainability.

However, memory leaks and stale callbacks are inevitably a concern when it comes to event subscription, and while many event systems do provide methods of cleanup, the ones I’ve encountered have felt somewhat cumbersome and unintuitive to me. 

Performance is another potential concern when it comes to event-driven architecture. When an event is too broad, listeners are forced to filter out the majority of triggered events in order to respond to the event that is applicable to their particular instance. That is potentially a lot of extraneous function calls.

This project is the result of my exploration into how an event system might include a developer-friendly cleanup interface for better memory leak prevention as well as a method of targeted listening for better performance.
<br/>
<br/>

## Table of Contents

- [Concepts](https://www.notion.so/Planify-8394600940b34c8ca76c4eca84eb5496)
    - [One-time Listener vs Sustained Listener](https://www.notion.so/Overkill-Check-Jan-8-99b852805af84c12aa64779bad3b0a40)
    - [Listener Morphing](https://www.notion.so/Planify-8394600940b34c8ca76c4eca84eb5496)
    - [Schedulers](https://www.notion.so/Planify-8394600940b34c8ca76c4eca84eb5496)
- [Memory Leak Prevention](https://www.notion.so/Planify-8394600940b34c8ca76c4eca84eb5496)
    - [Cleanup Strategies](https://www.notion.so/Planify-8394600940b34c8ca76c4eca84eb5496)
        - [Auto-cleanup](https://www.notion.so/Planify-8394600940b34c8ca76c4eca84eb5496)
        - [Options argument](https://www.notion.so/Planify-8394600940b34c8ca76c4eca84eb5496)
        - [Stop/Cancel](https://www.notion.so/Planify-8394600940b34c8ca76c4eca84eb5496)
        - [Scene Auto-cleanup](https://www.notion.so/Planify-8394600940b34c8ca76c4eca84eb5496)
    - [Memory Leak Warnings](https://www.notion.so/Planify-8394600940b34c8ca76c4eca84eb5496)
- [Targeted Listeners](https://www.notion.so/Planify-8394600940b34c8ca76c4eca84eb5496)
- [Planify API](https://www.notion.so/Planify-8394600940b34c8ca76c4eca84eb5496)
- Planned Features
- Known Issues
<br/>

## Concepts

In browser and Node.js API, the word “listener” refers to the callback function passed into the `addListener` function. This to me is a misnomer and it pains me to follow this convention. For clarity, this is how terms are used within the Planify framework:

```jsx
// Event: "mousedown"

onMouseDown(document, () => {}, { until: onDestroyed })
    |           |          |             |   
targeted    target     handler       options
listener
```

```jsx
// Hook: "table-populated"

onTablePopulated((context) => { context.dataset })
    |                        |
listener                 handler

castTablePopulated({ dataset });
  |                 |
emitter     context, data, or event object
```
<br/>

### Event vs Hook vs Message

In this repo, I use “emit” and “event” as general terms that encompass three distinct types of event emissions:

- **emitting user events** (normally the browser emits user events, but when working with components, you might want to forward user events to a parent component as is possible within the Vue component framework)
- **casting application/process hooks**
- **sending messages/commands**
<br/>

### Synchronous vs Asynchronous Handling

Handlers are called synchronously at the time of event emission. This allows for “before event” hooks and the possibility of handlers communicating back to the source of the event (see [`reply`](https://www.notion.so/P-cherie-acfd28a3d5e94c099603107bd32af191)). 

If asynchronous handling is needed, the developer can call an async scheduler or one-time listener from within the handler. In the example below, the synchonous handler calls the `addPS` scheduler (an alias for `queueMicrotask`) for asynchronous handling. (For other async schedulers, see Thread)

```tsx
onPopulated(() => addPS(() => {
    // do something
}))
```

Alternatively, when using Pecherie hooks, omit the callback function and options parameter to queue a microtask after an event is emitted via a promise:

```tsx
onPopulated()
    .then(() => { 
        // do something
    })

/* or */

await onPopulated();
// do something
```
<br/>

### One-time listener vs Sustained listener

There are two main types of listeners: one-time listeners and sustained listeners. As their names suggest, one-time listeners will listen once (i.e. the handler will run once) and the sustained listeners will continue to listen so long as the listener remains active (i.e. the handler will run every time the event or hook is emitted).

**Sustained listeners** return an `ActiveListener` object. This object has a single `stop` method, which can be called to stop the listener.

```jsx
const mouseMoveListener = 
    onMouseMove(document, () => { 
        // do work 
    });

onMouseUp(document, () => {
    mouseMoveListener.stop();
});
```

**One-time listeners** return a `PendingOp` object, which is a cancellable `Promise`. If canceled, the handler will never run.

```jsx
const pendingOp = onTextInserted(() => {
    // do work
    return result;
});

onActionCanceled(() => {
    pendingOp.cancel();
});

const result = await pendingOp;
```

Note: The `cancel` method will not survive a `.then` chain. This is by design. Since the return of a `.then` chain is too easily mistaken for the return of the first call rather than the last call of the chain, it is preferred to save the `PendingOp` to a variable before chaining or awaiting if you need to call the cancel method.
<br/>
<br/>

### Listener Morphing

A one-time listener can be turned into a sustained listener and vice-versa via the options parameter. The listener’s type definition will indicate whether it returns a `PendingOp` (as a one-time listener) or an `ActiveListener` (as a sustained listener). 
Besides, listener morphing, the options parameter is useful for marking listeners as one-time or sustained explicitly in the code.

```jsx
onTextInserted(() => {   // sustained listener
    // do work
}, { sustained: true });

onTextInserted(() => {   // one-time listener
    // do work
}, { once: true });

onTextInserted(() => {   // sustained listener
    // do work
}, { until: onActionCanceled });

onTextInserted(() => {   // one-time listener
    // do work
}, { unlessCanceled: onActionCanceled });
```

Listeners can also morph from their default depending on the usage context. For example, if a listener is being passed into another listener as a cleanup scheduler as is the case with `onActionCanceled` above, it will behave as a one-time listener even if it is a `SustainedListener`.
<br/>
<br/>

### Schedulers

Schedulers are one-time listeners that cannot be converted into a sustained listeners. These are typically functions that queue a task to the main thread such as: `queueTask`, `beforeScreenPaint` (planified `requestAnimationFrame`), and `onTimeout` (planified `setTimeout`). See Thread for more on existing schedulers.
<br/>
<br/>

## Memory Leak Prevention

Planify prevents memory leaks via three main approaches:

- by making handler cleanup more developer-friendly
- by logging warnings during development if a cleanup strategy is not in place
- with Typescript errors during development
<br/>

### Cleanup Strategies

Planify provides four main cleanup strategies:

- **Auto-cleanup:** One-time listeners enjoy automatic cleanup inherently. Sustained listeners can also enjoy automatic cleanup if initialized within a scope for which auto-cleanup has been defined. To enable auto-cleanup, define an auto-cleanup function before initializing an app:

    ```tsx
    // main.ts
    
    /* 
    Auto-cleanup callback must return PendingCancelOp | void.
    */
    
    defineAutoCleanup((cleanup) => { // callback receives a cleanup function as the argument
        if (isSettingUpComponent()) {
            return onUnmounted(cleanup);
        }
        if (isMakingModel()) {
            return onDestroyed(cleanup);
        }
    })
    
    const app = createApp(App);
    app.mount('#app');
    ```

    ```jsx
    // App.vue
    
    export default defineComponent({
        setup(){
            onPopulated(() => {  // auto-cleanup when component unmounts
                // do work
            })
        }
    })
    ```
    Note: The `onUnmounted` lifecycle hook in the example above is not the original hook provided by Vue; it is a planified version provided by Paravue. The planified version must be used to ensure auto-cleanup of auto-cleanup. See Planify API for how to planify existing hooks.

- **The options argument:** Specify when to stop/cancel a listener with the `until` / `unlessCanceled` property of the options argument.
    
    ```jsx
    onPopulated(() => {
        // so much work...
    }, { until: onDocClosed })    
    ```
    
    ```jsx
    // if the listener requires additional parameters beyond the handler:
    
    onPopulated(() => {
        // so much work...
    }, { unlessCanceled: (cancel) => onTimeout(5000, cancel) }) 
    ```
    
    ```jsx
    // NOT RECOMMENDED: using a non-planified listener 
    // (requires verbosity and conscientious programming to prevent memory leaks)
    
    onPopulated(() => {
        // so much work...
    }, { until: (stop) => doc.addEventListener("blur", stop, { once: true }) }) 
    ```
    
    **Note:** `stop` and `cancel` functions will only run once (if ever) and will be auto-cleaned-up if passed into a planified listener. If passed into a non-planified listener, the developer will be responsible for cleaning up the cleanup, resulting in cleanup hell. To avoid this, you can planify existing listeners/schedulers using the Planify API or create new planified listeners using the Pecherie API.
    
    **Important:** The cancellation scheduler must return a `PendingCancelOp` to ensure the cancel function is cleaned up once the handler is run:
    
    ```jsx
    // GOOD:
    onPopulated(() => {
        // do work...
    }, { unlessCanceled: onDocClosed })
    
    // GOOD, but unnecessarily verbose:
    onPopulated(() => {
        // do work...
    }, { unlessCanceled: (cancel) => onDocClosed(cancel) })
    
    // BAD:
    onPopulated(() => {
        // do work...
    }, { unlessCanceled: (cancel) => { onDocClosed(cancel) } }) // returns void
    
    // GOOD, but unnecessarily verbose
    onPopulated(() => {
        // do work...
    }, { unlessCanceled: (cancel) => { return onDocClosed(cancel); } })
    ```
    

- **The stop/cancel method**:  Stop a listener by calling the stop method on an `ActiveListener`; cancel a pending op by calling the cancel method on a `PendingOp`.
    
    ```jsx
    // stop an active listener
    
    const mouseMoveListener = 
        onMouseMove(document, () => { 
            // do work 
        });
    
    onMouseUp(document, () => {
        mouseMoveListener.stop();
    })
    ```
    
- **Scene cleanup:** Manage the lifetime of listeners by creating an impromptu listener scope, a “scene”, with  `beginScene`
    
    ```js
    // SFC script
    import { beginScene } from "@rue/planify"
    
    // create a 'dragging' scene
    function initDrag(event){
        const el = event.target;
        
        beginScene((dragging) => { // callback runs synchronously
            
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
                dragging.end();  // stops all listeners registered during scene
            });
        });
    }
    ```
    
    ```html
    <!-- SFC template -->
    <div @mousedown="initDrag">item</div>
    ```
    

    The `Scene` object can alternatively be accessed from outside the scene:

    ```jsx
    // This example doesn't represent a good use case; will replace with better example if I think of one...
    
    function initDrag(event){
        const el = event.target;
    
        const dragging = 
            beginScene(() => {
    
                onMouseEnter(el, () => {
                    // do work
                });
     
                onMouseLeave(el, () => {
                    // do work
                });
    
                onMouseMove(document, () => {
                    // do work
                });
            });
    
        onMouseUp(document, () => {
            // do work
            dragging.end();  // stops all listeners registered during scene
        }, { once: true } );
    }
    ```
<br/>

### Memory Leak Warnings

Unless the developer is impeccably conscientious about cleanup, memory leaks will inevitably creep into your system when using event listeners. As an additional guard against memory leaks, Planify will log a warning during development if it does not detect a cleanup strategy in place for a listener. 
<br/>
<br/>

## Targeted Listeners

Sometimes it is better for performance to target a particular instance when communicating via emitters. For this reason, Pecherie and Archer provide targeted listeners. Targeted listeners take in a targetID, which can be any type, so long as the emitter module and listener module agree on what to use as an identifier. 

```tsx
// using an object as the targetID with Archer API

// shared dependency
const HIDE_ITEM = defineMessage({
    message: "hide-item",
    targetID: $type as Object 
});

// listener module
heed(HIDE_ITEM, item, () => {
    // mutate local state to hide the item
});

// emitter module
send(HIDE_ITEM, { to: item });
```

If you would like to generate a deterministic string ID, Planify provides a simple ID generator that generates an ID based on a base id, optional prefixes, and an optional index.  

```tsx
// using a generated string ID

// listener module
import { genTargetID } from "@rue/planify";
import { heed } from "@rue/archer"

export default defineComponent({
    props: ["index", "item"],
    setup(props){
        const { item, index } = props;

        heed(HIDE_ITEM, genTargetID({
            id: item.id, // "item01"
            prefixes: ["Mirror", "InfoPanel"], 
            index: index // 9
        }), // "Mirror-InfoPanel_item01_9"
        () => {
            // mutate local state to hide the item
        });
    }
})

// emitter module
import { genTargetID } from "@rue/planify";
import { dispatch } from "@rue/archer"

const HIDE_ITEM = defineMessage({
    message: "hide-item",
    targetID: $type as string 
});

function workHard(item, index){
    // do work
        
    send(HIDE_ITEM, {
       to: genTargetID({
          id: item.id, 
          prefixes: ["Mirror", "InfoPanel"], 
          index
       }), // "Mirror-InfoPanel_item01_9"
    });
}
```
<br/>

## Planify API

The functions provided by Pecherie, Archer, Thread, and Paravue should cover most use cases. However, if you would like to planify an existing listener or scheduler, simply wrap the `$listen` or `$schedule` function in a function that returns its return.

Advanced usage: To provide better developer experience for users of the listener/scheduler, use Typescript generics so that `$listen` and `$schedule` return the appropriate type based on the callback and options passed into it.

```tsx
// planifying Vue's `watch`

type Watch = typeof watch;

export function onChange<
CB extends Parameters<Watch>[1], 
OPT extends ListenerOptions & WatchOptions,
>(target: Parameters<Watch>[0], callback: CB, options?: OPT) {
    let unwatch: WatchStopHandle;

    return $listen(callback, options, {
        enroll(cb) {
            unwatch = watch(target, cb, options);
        },
        remove() {
            unwatch();
        }
    });
}
```

```tsx
// planifying `requestAnimationFrame`

export function beforeScreenPaint<
CB extends Callback,
OPT extends ListenerOptions
>(callback: CB, options?: OPT) {
    let id: number;

    return $schedule(callback, options, {
        enroll(cb) {
            id = requestAnimationFrame(cb);
        },
        remove(cb) { 
            // NOTE: `remove` receives the callback as the argument 
            // for cases such as target.removeListener(cb)
            cancelAnimationFrame(id);
        }
    });
}
```
<br/>

## Planned Features

Event-driven code is notoriously difficult to debug. Additional support for easing the debugging experience is in the works.
<br/>
<br/>

## Known Issues

- [ ]  `dataAsArg` blocks VSCode’s Intellisense when configuring the creation of a hook or message. A work-around (for until I fix this) is to temporarily comment out the `dataAsArg: true` option when you want to access Intellisense.
    
    ```jsx
    // The issue:
    const [castPopulated, _onPopulated] = createHook({
        hook: "populated",
        data: $type as Data[],
        dataAsArg: true,
        // Intellisense (via CTRL+SPACE) fails to show rest of the options :(
    });
    ```
    ```jsx
    // Temporary fix
    const [castPopulated, _onPopulated] = createHook({
        hook: "populated",
        data: $type as Data[],
        // dataAsArg: true,
        // Intellisense can now show the rest of the options
    });
    ```
