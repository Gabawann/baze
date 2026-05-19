---
name: baze
description: Use when writing, editing, or reviewing Baze code (`.baze` files) — the fullstack functional language used in this codebase. Triggers on any touch to `.baze` files, mentions of Baze, TEA, `app.show` / `app.html` / `app.mini` / `app.front` / `app.fullstack` / `app.multi`, `init` / `update` / `view` / `cmds` / `subs`, or Baze compile errors. Apply even when the request sounds like generic frontend or fullstack work, if the target is a `.baze` file.
---

# Baze

Fullstack functional language. One function baze → JS + CSS + HTML + backend + DB + realtime communication . 
TEA architecture. **0 runtime errors by design** — everything is caught at compile time.

## Lexical rules (compile-enforced)

- **2-space indent**, grammatically significant. Never tabs, never 4 spaces.
- **Symbols lowercase** (`a`, `addNote`, `userList`). **Types Uppercase** (`Num`, `Text`, `Hero`).
- **Constructors lowercase** (`red`, `just`, `nothing`, `alive`).
- **`-- comment`** to end of line. No block comments.
- No `;`. No `return`. No `if`/`else`. No `switch`/`match`.
- No mutation. 
- Everything is an expression.

## Syntax core

```
-- Definition: symbol = expression
a = 42
b = 8
c = a + b                          -- 50

-- Primitives
flag = true                        -- Bool: true | false
n    = 42                          -- Num
m    = -3.14                       -- Num
t    = "hi"                        -- Text
ti   = "Hi ${n}"                   -- interpolation

-- Record (indented defs) / List (indented `- item`)
point =
  x = 10
  y = 20

xs =
  - 1
  - 2

-- Inline forms
p   = {x=10, y=20}
ns  = [1,2,3]

-- Nested
user =
  name = "Pauline"
  addresse =
    city = "Toulouse"
city = user.addresse.city          -- "Toulouse"

-- List of records
users =
  - name = "florian"
    age  = 34
  - name = "Pauline"
    age  = 28
```

## Block: Record vs Let

A block is an expression. **Only definitions → Record. Definitions + trailing expression → Let** (returns the trailing expression).

```
point =                            -- Record (no trailing expr)
  x = 10
  y = 20

sum =                              -- Let → 30
  a = 10
  b = 20
  a + b
```

## Functions & application

`params -> body`. Application by **juxtaposition** — NO parens, NO commas.

```
add = a b -> a + b

greet = name ->                    -- body is a Let
  msg = "Hello ${name}"
  msg

translate = p tx ty ->             -- body is a Record
  x = p.x + tx
  y = p.y + ty

two = add 1 1                      -- 2
welcome = greet "Pauline"

-- Multi-line application: indent each arg
p = translate
  {x=10, y=20}
  100
  200
```

Type annotations are optional (fully inferred): `symbol : Type = expression`.

```
add : Num, Num -> Num = a b -> a + b
```

## ADT (algebraic data types)

```
TrafficLight = red | orange | green

Reason = electricity | fire
TLR    = broken Reason | red | orange | green   -- broken takes a Reason

Hero = dead | alive {hp:Num, mana:Num}
h1   = alive {hp=50, mana=30}

-- Disambiguation with qualified constructor
x = TrafficLight.red
y = TLR.red

-- Multi-line constructor list
Hero2 =
  dead
  alive {hp:Num, mana:Num}
```

## Pattern matching `?` (exhaustive)

The compiler enforces exhaustiveness — cover every case or use `_`.

```
toText = light -> light ?
  red                -> "stop"
  orange             -> "slow"
  green              -> "go"
  broken electricity -> "no power"
  broken fire        -> "FIRE"

-- _ = wildcard, _name = bind matched value
isDanger = light -> light ?
  red      -> true
  broken _ -> true
  _        -> false

heroToText = h -> h ?
  dead         -> "dead"
  alive _stats -> "${toText _stats.hp} hp left"

-- Nested + record destructuring
hero ?
  alive {hp=0, mana} -> "dead, ${toText mana} mana"
  alive {hp, mana}   -> "alive"
  dead               -> "gone"

-- Open record (extra fields OK with ..)
event ?
  {key="h", ..} -> just dec
  {key="l", ..} -> just inc
  _             -> nothing

-- Bool as if/else
x > 5 ?
  true  -> "big"
  false -> "small"
```

## Record spread `..` (SUFFIX)

```
hit = p ->
  p..
  hp = p.hp - 10

-- Inline
hit2 = p -> {hp = p.hp - 10, p..}
```

## Import (expression from another file)

```
-- ./data.baze
name = "monamour"

-- ./main.baze
user       = ./data                -- {name="monamour"}
salutation = greet user.name
double = a ->
  math = ./math
  math.mult a 2
```

## Pipe `|>` and Holes `_` (partial application)

```
thirty = 20 |> double |> sub10     -- sub10 (double 20)

add10  = add _ 10                  -- a -> add a 10
result = 10 |> add _ 5 |> _ * 2    -- (10+5)*2 = 30

nums =
  [1,2,3,4,5,6,7,8,9,10]
  |> list.map _ double
  |> list.filter _ (_ < 10)
```

## Applications (TEA)

Entry point: `main.baze` at codebase root. **Pick the simplest mode that fits.**

| Mode            | Use case                                          | Blocks                                              |
|-----------------|---------------------------------------------------|-----------------------------------------------------|
| `app.show`      | Display a value (debug/testing)                   | bare expressions auto-wrap                          |
| `app.html`      | Static HTML/CSS                                   | just the Html expression                            |
| `app.mini`      | In-memory interactive (persisted to localStorage) | `init`, `update`, `view`                            |
| `app.front`     | + URL, keys, API, time                            | + `cmds`, `subs`                                    |
| `app.fullstack` | + backend + DB shared across users                | + `back.{init, update, cmds, subs, migrate}`        |
| `app.multi`     | Many apps sharing one codebase + domains          | list of `{name, app}`                               |

Declare `Action` (and `ActionBack` for fullstack) **at the top**, before `app.*`.

### app.show

```
app.show {message="Hello", count=42}

-- Bare expressions also auto-wrap into app.show:
x = 42
y = "hello"
```

### app.html

style "css-prop" "value"   -- raw CSS property
attr "html-attr" "value"   -- raw HTML attribute
batch [p 10, bg black, fc white]     -- group multiple attrs into one

HTML/CSS are Baze values. Stdlib helpers (Tailwind-inspired):

- Layout: `row`, `col`
- Spacing: `g` (gap), `p` / `px` / `py` (padding)
- Size: `w`, `h`
- Text: `txt`, `fs`, `fc`, `fw` (`.bold`)
- Style: `br`, `bg`, `o`
- Align: `as` / `ac` / `ae` (items), `js` / `jc` / `je` (content)
- Media: `img`, `video`, `svg`
- Pseudo / media queries: `hover [...]`, `active [...]`, `mobile [...]`, `tablette [...]`

```
app.html
  col [px 16, g 8]
    - txt [fs 24, fc "red"] "Baze"
    - txt [fs 16, fc "gray"] "simplicity"
    - img [w 100, h 50] "https://picsum.photos/100/50"

-- Pseudo:
txt [fc "gray", hover [fc "black"], active [fs 32]] "hi"
txt [mobile [fs 12], tablette [fs 24, active [fc "black"]]] "responsive"
```

### app.mini

```
Action = inc | dec
app.mini
  init   = 0
  update = m a -> a ?
    inc -> m + 1
    dec -> m - 1
  view = m -> row [fullCenter, g 16]
    - btn "-" dec
    - txt [fs 40] (toText m)
    - btn "+" inc
```

### Attributes — events

Events are just attributes — attach them in any attribute list. Each one dispatches an `Action` (or, for handlers, builds one from the input).

| Event              | Type                            |
|--------------------|---------------------------------|
| `onClick action`        | Click                           |
| `onPointerDown action`  | Pointer down                    |
| `onPointerUp action`    | Pointer up                      |
| `onPointerEnter action` | Pointer enter                   |
| `onPointerLeave action` | Pointer leave                   |
| `onInput handler`    | `(Text -> action)` — input changed |
| `onSubmit handler`   | `({field: Text} -> action)` — form submitted |

### Attributes — animation

- `pop attrs` — entry state. The element mounts with `attrs` applied, then transitions to its normal state.
- `out attrs` — exit state. When removed, the element transitions to `attrs` first, then unmounts.
- `ms n` — transition duration (default 400ms).
- `delay n` — transition delay before the transition starts.

```
-- fades + slides in on mount
txt [pop [o 0, y -20, s 0.8]] "hello"

-- slides out on removal
txt [out [o 0, x 100]] "bye"
```

`pop` / `out` set their own `ms` (400ms). To override the duration, put `ms` **after** them — otherwise `pop` / `out` overwrite it:

```
txt [pop [o 0], ms 200, delay 100] "delayed"
```

Animating on model state — drive style attrs from the model, add `ms` so changes ease instead of snapping, and use `cond` to apply a group of attrs only when a condition holds:

```
txt [ms 300, x model.offset, cond model.active [s 1.2, bg accent]] "tab"
```

**Why keys matter** — when a list changes, Baze diffs by position unless you give each item a stable, unique key. Without keys, removing an item shifts everything up and the wrong elements get the exit animation (or none at all). Keyed variants (`rowk`, `colk`, `txtk`) take that key as their first arg so each item keeps its identity across renders:

```
col [] (list.map model.items (item -> rowk item.id
  [h 50, bg rowBg, br 8
  , pop [o 0, x -100]
  , out [o 0, x  100, h 0, mt -8]]
  - txt [] item.name
  - btn "x" (remove item.id)))
```


### app.front (+ cmds + subs)

```
Action = inc | dec | askInc | askDec | setPath Text
app.front
  init = {path="/", count=0}
  update = m a -> a ?
    setPath p -> {path=p, m..}
    inc       -> {count=m.count+1, m..}
    dec       -> {count=m.count-1, m..}
    _         -> m
  view = m -> m.path ?
    "/remote" -> row [fullCenter]
      - btn [] "dec" askDec
      - btn [] "inc" askInc
    _ -> txt [fullCenter, fs 40] (toText m.count)
  cmds = m a -> a ?
    askInc -> front.broadcast inc
    askDec -> front.broadcast dec
    _      -> cmd.none
  subs = m -> front.onPathChange setPath
```

### app.fullstack

Data persists in DB. 
Declare `ActionBack` for server-side actions.

```
Action     = gotTasks (List Text) | askAdd Text | askRemove Text
ActionBack = addNote Text | removeNote Text | sendNotes

app.fullstack
  front =
    init   = []
    update = m a -> a ?
      gotTasks ts -> ts
      _           -> m
    view = m -> col [full, g 24]
      - form (d -> askAdd d.task) []
        - input  [name "task", placeholder "New task..."]
        - submit [] "Add"
      - col [] (list.map m (t -> rowk t
        [h 50, bg rowBg, br 8
        , pop [x -200, o 0, h 0, mt -8]
        , out [x  200, o 0, h 0, mt -8]]
        - txt [] t
        - btn [] "check" (askRemove t)))
    cmds = m a -> a ?
      askAdd    v -> front.sendToBack (addNote v)
      askRemove v -> front.sendToBack (removeNote v)
      _           -> cmd.none
    subs = m -> sub.none
  back =
    init = []
    update = sender db a -> a ?
      addNote    v -> list.append [v] db
      removeNote v -> list.filter db (x -> x /= v)
      _            -> db
    cmds    = sender db a -> back.broadcast (gotTasks db)
    subs    = db -> back.onConnect sendNotes
    migrate = old -> init
```

Front ↔ back:
- `front.sendToBack actionBack`
- `back.broadcast actionFront`            — to all clients
- `back.sendClient clientId actionFront`  — to one client
- `back.sendTab tabId actionFront`        — to one tab

### app.multi

```
app.multi
  - name = "landing"
    app = ./landing/main
  - name = "compteur"
    app = ./compteur/main
  - name = "todo"
    app = ./todo/main
```

Each sub-app can be any of `show` / `mini` / `front` / `fullstack`. Use to share components/types/styles across deployable apps under one build.

## Static folder

`statics/` at the app root. Any file there is served directly at its URL path (`statics/logo.png` → `/logo.png`). Range requests supported (video/audio streaming). Unknown paths fall back to the app. Use for images, fonts, favicons, downloads.

## Authentication

Built in — no setup. The current user is 
`User = userGuest {id:Text} | userAuth {id:Text, name:Text, mail:Text}`.

```
-- Read the user on startup
subs = m -> front.onInit (i -> gotInit i)   -- i = {path:Text, user:User}
update = m a -> a ?
  gotInit i -> {user=i.user, m..}
  _         -> m

-- Match to gate UI
m.user ?
  userAuth u -> txt [] "Hi ${u.name}"
  userGuest _ -> btn [] "Login" askLogin

-- Send a magic link (passwordless email login)
cmds = m a -> a ?
  askLogin -> front.sendMagicLink {name=m.name, mail=m.mail}
  _        -> cmd.none
```

Clicking the emailed link signs the user in and reloads as `userAuth`.

## Payment

Stripe checkout, driven from the backend. Setup: create a Stripe account, grab your secret API key, and add it to a `.env` file at the app root as `STRIPE_KEY=sk_...`. The `.env` is synced to the runtime by the CLI. Without that key `back.checkout` fails and dispatches `onFail`.

```
ActionBack = buy | paid | failed
back =
  update = sender db a -> a ?
    paid   -> {pro=true, db..}
    _      -> db
  cmds = sender db a -> a ?
    buy -> back.checkout sender
      {amount=900, currency="eur", label="Pro plan", onPaid=paid, onFail=failed}
    _   -> cmd.none
```

`amount` is in cents (`900` = 9.00 €). `back.checkout` redirects the user's tab to Stripe's hosted page, then dispatches `onPaid` / `onFail` (as an `ActionBack`) back to `back.update` when they return. Only works for a real user/guest `Sender` — `server` always fails.

## Common patterns

```
-- Conditional render — match a Bool
m.loggedIn ?
  true  -> txt [] "Welcome ${m.name}"
  false -> btn "Login" doLogin

-- Keyed list (REQUIRED for animations) — rowk / colk / txtk take stable key first
col [] (list.map m.items (i -> rowk i.id
  [h 50, bg rowBg, br 8
  , pop [o 0, x -100]
  , out [o 0, x  100, h 0, mt -8]]
  - txt [] i.name
  - btn "x" (remove i.id)))

-- Routing
subs = m -> front.onPathChange setPath
cmds = m a -> a ?
  goTo p -> front.pushPath p
  _      -> cmd.none
view = m -> m.path ?
  "/"      -> home m
  "/about" -> about m
  _        -> notFound

-- Keyboard shortcuts
subs = m -> front.onKey (k -> k ?
  {key="h", ..}      -> just dec
  {key="l", ..}      -> just inc
  {code="Space", ..} -> just toggle
  _                  -> nothing)
```

## Common mistakes (compare before writing)

| Wrong                          | Right                              | Why                                          |
|--------------------------------|------------------------------------|----------------------------------------------|
| `add(1, 2)`                    | `add 1 2`                          | Juxtaposition — no parens, no commas         |
| `Just x`, `Nothing`            | `just x`, `nothing`                | Constructors lowercase, types Uppercase      |
| `match x with` / `switch`      | `x ? pat -> expr`                  | `?` is the match operator                    |
| `if c then a else b`           | `c ? true -> a` newline `false -> b` | No `if`; Bool matched like any ADT         |
| `a = 10; b = 20`               | newline-separated                  | No semicolons                                |
| `return x`                     | let with trailing expression       | Everything is an expression                  |
| `(x) => { return x+1 }`        | `x -> x + 1`                       | Arrow `->`; Let for multi-line body          |
| 4-space / tab indent           | 2 spaces                           | Indentation is grammatically significant     |
| Partial `?` match              | cover every case, or `_`           | Exhaustiveness compile-enforced              |
| `{...m, count: n}`             | `{count = n, m..}`                 | Spread is `name..` (suffix); fields use `=`  |
| `model.count++`                | return a new record                | No mutation anywhere                         |

## Method (building a new feature)

1. Define **model** — minimal data for v1.
2. Define minimal **actions**.
3. Write `update` : `Model, Action -> Model`.
4. Write `view`   : `Model -> Html`.
5. Iterate: add state/actions. Repeating pattern → function. Branching → pattern matching.

## Absolute do-nots

- **No FFI.** If unavoidable, wrap so it cannot throw — must return `Maybe` / `Result`.
- **No runtime errors.** Every failure mode must be expressed in the type system (`Maybe`, `Result`, exhaustive `?`).

## Reference

- `grammar.pegjs` — grammar
- `compiler/` — compiler internals
- `lib/std.baze` (in the user codebase) — auto-imported stdlib (ground truth for built-in names/types). The canonical/seed version lives at `server/init/lib/std.baze`.
- Examples — read one close to what you're building before writing
