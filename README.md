# jsonlang
Interpreter for a json-based language

## Example syntax

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
