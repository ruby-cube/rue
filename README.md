# Rue

<aside>
⚠️ Experimental: The projects in this repo are currently works-in-progress, not well-tested, with volatile APIs. Look and play, but definitely don’t use…
</aside>

## Overview

Rue.js is a collection of tools I created for myself in the process of building a fairly complex app (a Notion-like thought organizer tool). The tools aim to support maintainability and extensibility as an app becomes more complex and thus more prone to scattered logic and tight coupling of unrelated modules. 

The repo contains the following categories of tools: Event-driven programming, data management, control flow, and Vue reactivity. (Note that since Vue’s reactivity system is decoupled from the Vue component framework, the tools in this category can be used outside of Vue components)


## Installation

(coming soon)


## Demo

(coming eventually)

## The Tools

*Event-driven Programming*

[Planify](https://www.notion.so/Planify-8394600940b34c8ca76c4eca84eb5496)

The core dependency for the other tools in this category. Designed to make asynchronous, event-driven programming more readable and less prone to memory leaks.

[Pêcherie](https://www.notion.so/P-cherie-acfd28a3d5e94c099603107bd32af191)

Creates targeted and untargeted process hooks for your application/modules.

[Archer](https://www.notion.so/Archer-42264c94379042f88e88d29d85db236b)

Sends and receives targeted messages/commands.

[Thread ](https://www.notion.so/Thread-3a8048a8637c4571a7a799dd915075d0)

Provides planified versions of schedulers and event listeners from Web API.

[Paravue](https://www.notion.so/Paravue-838d8b1e6cf84b6eb1a5bea6d361ca9f)

Provides planified versions of Vue’s watch and computed as well as reactivity markers.

[Ephemr](https://www.notion.so/Ephemr-4a919dd842304ed4b1bc6686a9cfe583)

(coming soon-ish) Creates state machines using planified events and hooks

*Data Management*

[Être](https://www.notion.so/tre-61fe158b3d6a4b0991e6f3fabd61f716)

A system of composition for rich data models

[**Modos**](https://www.notion.so/Modos-23f0c39ec7bc448fa94c622c19b9df63)

(coming soon-ish) An in-memory data model store that leverages Vue’s reactivity system. Particularly useful for tree structures.

Includes several optional modules

- **Revive**: normalize and denormalize data *need to implement normalization..
- **Vine**: two-way tree structure
- **Persistence**: batches changes for calls to the database
- **History**: batches changes for undo/redo

*Control Flow*

[**Nautic**](https://www.notion.so/Nautic-24c9de45e2aa4dc29f6ebf8a26e03ffd)

(coming soon-ish) Compile control flow maps for complex control flows.

[Voile](https://www.notion.so/Voile-dfa4077876c84475925748a40eda33a2)

(coming soon-ish) Compositional control flow for making complex control flows more efficient.

*Vue Reactivity*

[🌴 Paravue](https://www.notion.so/Paravue-838d8b1e6cf84b6eb1a5bea6d361ca9f)

Provides planified versions of Vue’s watch and computed as well as reactivity markers.

[Actionry](https://www.notion.so/Actionry-75c2b783ca6d4f64a7f1be8515fafd1f)

Define actions. Useful for batching reactive effects based on actions.

## Compatibility

While most of the tools are theoretically framework-agnostic, they were built with Vue 3 in mind and have not been tested with other frameworks. Note that some of the libraries leverage Vue 3’s [awesome!] reactivity system though the library itself can be used within any framework or a vanilla app.

Typescript is highly encouraged for less headaches when defining types.

## Conventions

Some conventions you may notice in the source code and the examples:

- Development-only variables are often prefixed with double underscore to be removed at build time.
- A dollar sign prefix `$` is used to indicate some sort of specialness. I use it in my codebases and examples to indicate the following:
    - a macro variable that will be (or potentially will be) eliminated or transformed at build time
    - a variable that serves as a stand-in until the actual value is available to plug in
    - in the Etre framework, an abstract role, which behave distinctly from a class

## The `$type` variable

Many of the functions in this repo take in configurations that are purely for typing purposes. If using pure Javascript, you can pass in an object or primitive that satisfies the type definition, for example: 

```tsx
const [castMounted, onMounted] = createHook({
	 data: { id: "" }, // enables type hints
});

onMounted((data) => {
	 data // type hint: { id: string }
});
```

However, to make it explicit that the argument is a type definition, Rue utils provides a special `unknown`-typed variable, `$type`, that can be cast into any type you need. 

This convention opens the opportunity to remove the argument or config property at build time for leaner shipped code. 

```tsx
import { $type } from "@rue/utils";

const [castMounted, onMounted] = createHook({
		hook: "mounted",
		data: $type as { id: string }, // enables type hints
});

// can theoretically transform to: (...once I've built the plugin)
const [castMounted, onMounted] = createHook({
		hook: "mounted",
});
```

## Inspiration

**Vue.js**

I am heavily influenced and greatly inspired by Vue and its brilliant, elegant, and intuitive design, especially Vue 3’s Composition API.

Vue is also how I was introduced to the concept of emitting events and lifecycle hooks. It was such a fascinating concept to me that I began exploring ways to emit my own hooks outside of the Vue framework, which led to the various event systems in this repo.

**Quill**

The Quill docs and codebase opened my eyes to how beautiful and poetic an open source codebase can be without compromising the end product. I previously felt I had to suppressed the urge to write poetic code. Quill helped me realize that as long as it doesn’t impede clarity and I’m working on my own project… why not? :)

## Jiufen

Perusing a complex codebase, with all the paths of communication and connections between components, can sometimes be like wandering the maze-like lantern-lined walkways and underground tunnels of [Jiufen](https://www.nationalgeographic.com/travel/article/exploring-the-magic-of-taiwans-spirited-away-city). 

Confusing and chaotic yet magical and wondrous.
