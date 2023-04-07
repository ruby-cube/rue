<p align="center">
  <img width="240" src="https://github.com/ruby-cube/rue/blob/main/rue-logo%403x.png" alt="rue logo"/>
</p>

# Rue

<aside style="background-color: #444">
⚠️ <b>Experimental</b>: The projects in this repo are works-in-progress, not well-tested, with volatile APIs. Look and play, but definitely don’t use…
</aside>
<br/>
<br/>

## Overview

Rue.js is a collection of tools I created for myself in the process of building a fairly complex app. The tools aim to support maintainability and extensibility as an app becomes more complex and thus more prone to scattered logic and tight coupling of unrelated modules. 

The repo contains the following categories of tools: Event-driven programming, data management, control flow, and Vue reactivity. (Note that since Vue’s reactivity system is decoupled from the Vue component framework, the tools in this category can be used outside of Vue components)
<br/>
<br/>

## Installation

*(coming soon)*
<br/>
<br/>

## Demo

*(coming eventually)*
<br/>
<br/>

## The Tools

***Event-driven Programming***

[**🪶 Planify**](https://www.notion.so/Planify-8394600940b34c8ca76c4eca84eb5496)
<br/>
The core dependency for the other tools in this category. Designed to make asynchronous, event-driven programming more readable and less prone to memory leaks.

[**🐟 Pêcherie**](https://www.notion.so/P-cherie-acfd28a3d5e94c099603107bd32af191)
<br/>
Creates targeted and untargeted process hooks for your application/modules.

[**🏹 Archer**](https://www.notion.so/Archer-42264c94379042f88e88d29d85db236b)
<br/>
Sends and receives targeted messages/commands.

[**⏳ Thread**](https://www.notion.so/Thread-3a8048a8637c4571a7a799dd915075d0)
<br/>
Provides planified versions of schedulers and event listeners from Web API.

[**🌴 Paravue**](https://www.notion.so/Paravue-838d8b1e6cf84b6eb1a5bea6d361ca9f)
<br/>
Provides planified versions of Vue’s watch and computed as well as reactivity markers.

**🥀 Ephemr**
<br/>
(coming soon-ish) Creates state machines using planified events and hooks

<br/>

***Data Management***

[**🪴 Être**](https://www.notion.so/tre-61fe158b3d6a4b0991e6f3fabd61f716)
<br/>A system of composition for rich data models

**🔔 Modos**
<br/>
*(coming soon-ish)* An in-memory data model store that leverages Vue’s reactivity system. Particularly useful for tree structures. Includes several optional modules:
- **Revive**: normalize and denormalize data
- **Vine**: two-way tree structure
- **Persistence**: batches changes for calls to the database
- **History**: batches changes for undo/redo

<br/>

***Control Flow***

**🔱 Nautic**
<br/>
*(coming soon-ish)* Compile control flow maps for complex control flows.

**⛵ Voile**
<br/>
*(coming soon-ish)* Compositional control flow for making complex control flows more efficient.

<br/>

***Vue Reactivity***

[**🌴 Paravue**](https://www.notion.so/Paravue-838d8b1e6cf84b6eb1a5bea6d361ca9f)
<br/>
Provides planified versions of Vue’s watch and computed as well as reactivity markers.

[**🎬 Actionry**](https://www.notion.so/Actionry-75c2b783ca6d4f64a7f1be8515fafd1f)
<br/>
Define actions. Useful for batching reactive effects based on actions.
<br/>
<br/>

## Compatibility

While most of the tools are theoretically framework-agnostic, they were built with Vue 3 in mind and have not been tested with other frameworks. Note that some of the libraries leverage Vue 3’s (awesome!) reactivity system though the library itself can be used within any framework or a vanilla app.

Typescript is highly encouraged for less headaches when defining types.
<br/>
<br/>

## Conventions

Some conventions you may notice in the source code and the examples:

- Development-only variables are often prefixed with double underscore to be removed at build time.
- A dollar sign prefix `$` is used to indicate some sort of specialness. I use it in my codebases and examples to indicate the following:
    - a macro variable that will be (or potentially will be) eliminated or transformed at build time
    - a variable that serves as a stand-in until the actual value is available to plug in
    - in the Être framework, an abstract role, which behaves distinctly from a class
<br/>

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
<br/>

## Contribution
I'm currently not looking for code contributions. However, I'm completely new to open source and would appreciate guidance from experienced open sourcerors particularly with regards to publishing to NPM, semantic versioning, managing monorepos, configuring package.json, typescript, build tools, scripts, and other dev ops stuff.

I'm also relatively new to software engineering itself (~2 years) and have been learning and building in isolation, so, to be quite honest, I don't know if what I've built and written is extremely naive. I'm not even clear on whether Planify and Être are considered libraries or frameworks. Thoughts and gentle feedback from more experienced devs would be appreciated.

Send a note to ruby.yiong@gmail.com. I would especially love to connect with someone in the Seattle area, though help from anywhere in the world is appreciated too.

<br/>

## Inspiration

**Vue.js**

I am heavily influenced and greatly inspired by Vue and its brilliant, elegant, and intuitive design, especially Vue 3’s Composition API. Vue is also how I was introduced to the concept of emitting events and lifecycle hooks. It was such a fascinating concept to me that I began exploring ways to emit my own hooks outside of the Vue framework, which led to the various event systems in this repo.

<br>

**Quill**

The Quill docs and codebase opened my eyes to how beautiful and poetic an open source codebase can be without compromising the end product. I previously felt I had to suppressed the urge to write poetic code. Quill helped me realize that as long as it doesn’t impede clarity and I’m working on my own project… why not? :)
<br/>
<br/>

## Jiufen

Perusing a complex codebase, with all the paths of communication and connections between components, can sometimes be like wandering the maze-like lantern-lined walkways and underground tunnels of [Jiufen](https://www.nationalgeographic.com/travel/article/exploring-the-magic-of-taiwans-spirited-away-city). 

Confusing and chaotic yet magical and wondrous.

<br/>
<br/>

© 2023-present Ruby Y Wang
