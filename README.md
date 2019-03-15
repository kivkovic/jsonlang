# jsonlang
Interpreter for a json-based language

## Syntax

Variables:
```javascript
[                  /* static typed as: */
  {'$a': 10},      /*  - number        */
  {'$c': 'hello'}, /*  - string        */
  {'$b': '$a'},    /*  - number        */
  {'$a': 2}
]
```

Arithmetic:
```javascript
[
  {'$a': 5}, 
  {'$b':
    {'*': 
      [
        7, 
        '$a', 
        {'+': [1, 2, 3]}, 
        2
      ]
    }
  }
]
```

Conditional:
```javascript
{'?': '$a', ':': {'$b': 6}}
```

Loop:
```javascript
[
  {'$a': 5},
  {
    '?': '$a', 
    '@': [
      {'$a': {'-': ['$a', 1]}}
    ]
  }
]
```

Lists:
```javascript
[
  {'$a': [1, 2, 3, 4]},
  {'$b': []},
  {'$c': 0},
  {
    '?': {'<': ['$c', {'$': '$a'}]},
    '@': [
      {'$b': {'<+': ['$b', {'.': [ '$a', '$c' ]}] } },
      {'$c': {'+': ['$c', 1]}}
    ]
  }
]
```

Function:
```javascript
[
  {'$a': 4},
  {
    '$c': {
      '$': [{ '$x': 0 }, {'$y': 0}], // argument type def
      '#': [
        { '$x': {'+': ['$x', '$y']} },
        '$x'
      ]
    }  
  },
  {'$d' : {'&': '$c', '$': ['$a', 2] } },
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
