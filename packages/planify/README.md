# Planify

<aside>
⚠️ **Experimental:** Planify is a work-in-progress, not well-tested nor optimized, with a volatile API. Look and play, but definitely don’t use…

</aside>

## Overview

When building complex applications with many interacting parts, event-driven programming enables loose-coupling, proper delegation of responsibilities, and extensibility of modules that are closed to modification, thus improving application maintainability.

However, memory leaks and stale callbacks are inevitably a concern when it comes to event subscription, and while many event systems do provide methods of cleanup, the ones I’ve encountered have felt somewhat cumbersome and unintuitive to me. 

Performance is another potential concern when it comes to event-driven architecture. When an event is too broad, listeners are forced to filter out the majority of triggered events in order to respond to the event that is applicable to their particular instance. That is potentially a lot of extraneous function calls.

This project is the result of my exploration into how an event system might include a developer-friendly cleanup interface for better memory leak prevention as well as a method of targeted listening for better performance.

## Table of Contents

- [Use Case](https://www.notion.so/Planify-8394600940b34c8ca76c4eca84eb5496)
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

## Use Case

In most cases, simple function declaration and invocation is sufficient to achieve a task. Beware of overusing these functions as there is a performance cost (in a similar way promises are more costly than simple callbacks). Using emitters and listeners only becomes useful when you need to communicate across different modules or scopes. It allows you to delegate responsibilities to the appropriate scope, improving the readability and maintainability of a complex codebase.

## Concepts

In browser API, the word “listener” refers to the callback function passed into the “addListener” function. This to me is a misnomer and it pains me to follow this convention, so for clarity, this is how terms are used within the Planify framework:

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
emitter/caster     hook-context
```

### Event vs Hook vs Message

In this repo, I use “emit” and “event” as the general terms that encompass three distinct types of event emissions:

- emitting user events
- casting process hooks (emitting app events)*
- sending messages/commands

*Whichever it’s called depends on whether the developer more intuitively conceptualizes an event as an event or as a point within a process. However, to draw a clearer distinction user events and app events, I refer to all app events as hooks.

### Synchronous vs Asynchronous Handling

Handlers are called synchronously at the time of event emission. This allows for “before event” hooks and the possibility of handlers communicating back to the source of the event (see [`reply`](https://www.notion.so/P-cherie-acfd28a3d5e94c099603107bd32af191)). 

If asynchronous handling is needed, the developer can call whichever asynchronous handling they need within the handler—`setTimeout`, `addPS`/`queueMicrotask`, `queueTask`/`setImmediate`, some other hook, rAF, etc. 

```tsx
onTablePopulated(() => addPS(() => {
		// do something
}))
```

Alternatively, when using Pecherie hooks, omit the callback function and options to queue a microtask after an event is emitted:

```tsx
onTablePopulated()
		.then(() => { 
				// do something
		})

/* or */

await onTablePopulated();
// do something
```

### One-time listener vs Sustained listener

There are two main types of listeners in the Planify framework: one-time listeners and sustained listeners. As their names suggest, one-time listeners will listen once (i.e. the handler will run once) and the sustained listeners will continue to listen so long as the listener remains active (i.e. the handler will run every time the event or hook is emitted).

**Sustained listeners** return an `ActiveListener` object. This object has a single `stop` method, which can be called to stop the listener.

```jsx
const mouseMoveListener = 
   onMouseMove(document, () => { 
       // do work 
   });

onMouseUp(document, () => {
   mouseMoveListener.stop();
}
```

**One-time listeners** return a `PendingOp` object, which is a cancellable `Promise`. If canceled, the handler will never run.

```jsx
const pendingOp = onTextInserted(() => {
   // do work
   return result;
}

onActionCanceled(() => {
	 pendingOp.cancel();
}

const result = await pendingOp;
```

Note: The `cancel` method will not survive a `.then` chain. This is by design. The return of chained `.then` calls is too easily read as the return of the first call rather than the last call of the chain. Save the `PendingOp` to a variable before chaining or awaiting if you need to call the cancel method.

### Listener Morphing

A one-time listener can be turned into a sustained listener and vice-versa simply by option configuration. The listener’s type definition will indicate whether it returns a `PendingOp` (as a one-time listener) or an `ActiveListener` (as a sustained listener). If you want the type of listener to be explicit in the code itself, simply indicate it in the options argument with, for example `{ once: true }`.

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

Listeners can also behave differently from their default depending on their context of usage. For example, if a listener is being passed into another listener as a cleanup scheduler as is the case with `onActionCanceled` above, it will behave as a one-time listener even if it is a `SustainedListener`.

### Schedulers

Schedulers are one-time listeners that cannot be converted into a sustained listeners. These are typically functions that queue a task to the main thread such as: `queueTask`, `beforeScreenPaint` (planified `requestAnimationFrame`), and `onTimeout` (planified `setTimeout`). See Thread for more on existing schedulers.

## Memory Leak Prevention

Planify prevents memory leaks via three main approaches:

- by making handler cleanup more user-friendly
- by logging warnings during development if a cleanup strategy is not in place
- with Typescript errors during development

### Cleanup Strategies

Planify provides four basic types of strategies for cleanup.

- **Auto-cleanup:** One-time listeners enjoy automatic cleanup inherently. Sustained listeners can also enjoy automatic cleanup if they are initialized within a scope for which auto-cleanup has been defined. To enable auto-cleanup, define an auto-cleanup function before initializing an app:

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
        return onDisposedOf(cleanup);
    }
})

const app = createApp(App);
app.mount('#app');
```

```jsx
// App.vue

export default defineComponent({
	setup(){
		 onTablePopulated(() => {  // auto-cleanup when component unmounts
	     // do work
     })
  }
})
```

- **The options argument:** Specify when to stop/cancel a listener with the `until` / `unlessCanceled` property of the options argument.
    
    ```jsx
    onTablePopulated(() => {
    		// so much work...
    }, { until: onDocClosed })	
    ```
    
    ```jsx
    // if the listener requires additional parameters beyond the handler:
    
    onTablePopulated(() => {
    		// so much work...
    }, { unlessCanceled: (cancel) => onTimeout(5000, cancel) }) 
    ```
    
    ```jsx
    // NOT RECOMMENDED: using a non-planified listener 
    // (requires verbosity and conscientious programming to prevent memory leaks)
    
    onTablePopulated(() => {
       // so much work...
    }, { until: (stop) => doc.addEventListener("blur", stop, { once: true }) }) 
    ```
    
    **Note:** `stop` and `cancel` functions will only run once (if ever) and will be auto-cleaned-up if passed into a planified listener. If passed into a non-planified listener, the developer will be responsible for cleaning up the cleanup …which results in cleanup hell. To avoid this, you can planify existing listeners/schedulers using the Planify API or create new planified listeners using the Pecherie API.
    
    **Important:** The cancellation scheduler must return a `PendingCancelOp` to ensure the cancel function is cleaned up once the handler is run.
    
    ```jsx
    // GOOD:
    onTablePopulated(() => {
    		// do work...
    }, { unlessCanceled: onDocClosed })
    
    // GOOD, but unnecessarily verbose:
    onTablePopulated(() => {
    		// do work...
    }, { unlessCanceled: (cancel) => onDocClosed(cancel) })
    
    // BAD:
    onTablePopulated(() => {
    		// do work...
    }, { unlessCanceled: (cancel) => { onDocClosed(cancel) } }) // returns void
    
    // GOOD, but unnecessarily verbose
    onTablePopulated(() => {
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
    }
    ```
    
- **The scene method:** Manage the lifetime of listeners by creating an impromptu listener scope, a “scene”, with  `beginScene`
    
    ```jsx
    // SFC script
    import { beginScene } from "@rue/planify"
    
    // create a 'dragging' scene
    function initDrag(){
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
    		      dragging.end()  // stops all listeners registered during scene
    	     })
       });
    }
    ```
    
    ```html
    <!-- SFC template -->
    <div @mousedown="initDrag">item</div>
    ```
    

The `Scene` object can alternatively be accessed from outside the scene:

```jsx
// This example doesn't represent a good use case; will replace with
// better example if I think of one...

function initDrag(){

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
	    dragging.end()  // stops all listeners registered during scene
   }, { once: true } )
}
```

### Memory Leak Warnings

Unless the developer is impeccably conscientious about cleanup, memory leaks will inevitably creep into your system when using event listeners. As an additional guard against memory leaks, Planify will log a warning during development if it does not detect a cleanup strategy in place for a listener. 

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

## Planify API

The functions provided by Pecherie, Archer, Thread, Paravue, and Scene should cover many use cases. However, if you would like to planify an existing listener or scheduler, simply wrap the `$listen` and `$schedule` functions.

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

## Planned Features

Event-driven code is notoriously difficult to debug. Additional support for easing the debugging experience is in the works.

### Known Issues

- [ ]  `dataAsArg` blocks VSCode’s Intellisense when configuring the creation of a hook or message. A work-around (for until I fix this) is to temporarily comment out the `dataAsArg: true` option when you want to access Intellisense.
    
    ```jsx
    // The issue:
    const [castTablePopulated, _onTablePopulated] = createHook({
    	 hook: "table-populated",
    	 data: $type as Data[],
    	 dataAsArg: true,
       // Intellisense (via CTRL+SPACE) fails to show rest of the options :(
    }) 
    
    // Temporary fix
    const [castTablePopulated, _onTablePopulated] = createHook({
    	 hook: "table-populated",
    	 data: $type as Data[],
    	 // dataAsArg: true,
       // Intellisense can now show the rest of the options
    }) 
    ```