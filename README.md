# jsonlang
Interpreter for a json-based language

## Syntax

Variables:
```javascript
[
  {a:10}, 
  {b: {'&':'a'} }
]
```

Arithmetic:
```javascript
[
  {'a': 5}, 
  {'b':{'*': [7, {'&': 'a'}, {'+': [1, 2, 3]}, 2]}}
]
```

Conditional:
```javascript
{'?': {'&': 'a'}, ':': {'b': 6}}
```

Loop:
```javascript
{
  '?': {'&': 'a'}, 
  '@': [
    {'a': {'-': [{'&': 'a'}, 1]}}
  ]
}
```

Function:
```javascript
[
  {'a': 4},
  {
    'c': {
      '$': [{ 'x': 0 }, {'y': 0}],
      '#': [
        { 'x': {'+': [{'&':'x'}, {'&':'y'}]} },
        { '&': 'x' }
      ]
    }  
  },
  {'d' : {'@': 'c', '$': [{ '&' : 'a' }, 2] } },
]
// d == 6
```

## Usage

```javascript
const juck = require('./jsonlang.js').juck;
const functions = { /* back API */ };
const state = { };
juck(input, functions, state);
```
