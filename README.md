# jsonlang
Interpreter for a json-based language

## Syntax

Assignment to variables:
```javascript
[{a:0}, {b:'a'}, {a:2}]
```

Referencing a variable:
```javascript
[{a:0}, {b:'a'}, {a:2}]
```

Arithmetic:
```javascript
[{'a':5}, {'b':{'*': [7, {'&':'a'}, 8, -2]}}]
```

## Example

```javascript
[
  {'a': 5},
  {'b': 0},
  {
    '?': {'&': 'a'},
    '@': [
       {'a': {'-': [{'&':'a'}, 1]}},
       {'b': {'+': [{'&':'b'}, 1]}},
    ]
  }
]
```

Pseudocode:

```javascript
a = 5;
b = 0;
while (a) {
  a--;
  b++;
}
```
