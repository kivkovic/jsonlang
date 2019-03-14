# jsonlang
Interpreter for a json-based language

## Syntax

Variables:
```javascript
[{a:10}, {b: {'&':'a'} }, {a:2}]
```

Arithmetic:
```javascript
[{'a': 5}, {'b':{'*': [7, {'&': 'a'}, 8, -2]}}]
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
  {'c': {
    '$': [{ 'x': 0 }],
    '#': [
      { 'x': {'+': [{'&':'x'}, 1]} },
      { '&': 'x' }
    ]
  }  },
  {'d' : {'@': 'c', '$': ['a'] } },
]
```

