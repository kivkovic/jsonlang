const juck = require('./jsonlang.js').juck;

const assert = (title, program, $functions, $variables, expression) => {
    $return = juck(eval(program), $functions, $variables);
    console.log(
        title,
        Array(80 - title.length).join('.'),
        !expression({ $functions, $variables, $return })
            ? ['ERROR', {$functions, $variables: JSON.stringify($variables), $return}]
            : 'OK'
    );
}

const assertFail = (title, program, $functions, $variables, throwRegex) => {
    try {
        $fail = juck(eval(program), $functions, $variables);
        console.log(
            title,
            Array(80 - title.length).join('.'),
            ['ERROR', {$functions, $variables: JSON.stringify($variables), $return}]
        );
    } catch (error) {
        console.log(
            title,
            Array(80 - title.length).join('.'),
            !`${error}`.match(throwRegex) 
                ? ['ERROR', {$functions, $variables: JSON.stringify($variables), $return, $thrownError: error}]
                : 'OK'
        );
    }
}

// tests

assert('quine',
    1,
    {}, {},
    ({ $return }) => $return === 1
);

// variables

assert('init & assign',
    [{a:10}, {b: {'&':'a'} }, {a:2}],
    {}, {},
    ({ $variables }) => $variables.a === 2 && $variables.b === 10
);

assert(
    'double pointer',
    [{'b':5}, {a: {'&':'b'}}, {'c': {'&':'a'}}],
    {}, {},
    ({ $variables }) => $variables.a === $variables.b && $variables.b === $variables.c && $variables.c === 5
);

// nested member assignment...

// arithmetic

assert(
    'sum',
    [{'a': 5}, {'b':{'+': [7, {'&':'a'}, 8, -2]}}],
    {}, {},
    ({ $variables }) => $variables.b === 18
);

assert(
    'diff',
    [{'a': 5}, {'b':{'-': [{'&':'a'}, 7, 8, -2]}}],
    {}, {},
    ({ $variables }) => $variables.b === -8
);

assert(
    'mul',
    [{'a': 5}, {'b':{'*': [7, {'&':'a'}, 8, -2]}}],
    {}, {},
    ({ $variables }) => $variables.b === -560
);

assert(
    'div',
    [{'a': 5}, {'b':{'/': [7, {'&':'a'}, 8, -2]}}],
    {}, {},
    ({ $variables }) => $variables.b.toFixed(8) === (-0.0017857142857142857).toFixed(8)
);

assert(
    'mod',
    [{'a': 59}, {'b':{'%': [701, {'&':'a'}, 19, -4]}}],
    {}, {},
    ({ $variables }) => $variables.b === 2
);

assert(
    'xor',
    [{'a': 71}, {'b': {'^': [53, {'&':'a'}, 89, -20]}}],
    {}, {},
    ({ $variables }) => $variables.b === -57
);

assert(
    'lt',
    [{'b': 5}, {'a': { '<': [ 10, {'$': 'b'} ] }}],
    {}, {},
    ({ $variables }) => $variables.a === false
);

assert(
    'gt',
    [{'b': 5}, {'a': { '>': [ 10, {'$': 'b'} ] }}],
    {}, {},
    ({ $variables }) => $variables.a === true
);

assert(
    'eq',
    [{'b': 5}, {'a': { '==': [ 10, {'$': 'b'} ] }}],
    {}, {},
    ({ $variables }) => $variables.a === false
);

assert(
    'neq',
    [{'b': 5}, {'a': { '!=': [ 10, {'$': 'b'} ] }}],
    {}, {},
    ({ $variables }) => $variables.a === true
);

// if

assert('if', [
        {'a': 1},
        {'b': 9},
        {'?': {'&': 'a'}, ':': {'b': 6} }
    ],
    {}, {},
    ({ $variables }) => $variables.b === 6);

assert('if-not', [
        {'a': 0},
        {'b': 9},
        {'?': {'&': 'a'}, ':': {'b': 6} }
    ],
    {}, {},
    ({ $variables }) => $variables.b === 9);

// loop

assert(
    'loop',
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
    ],
    {}, {},
    ({ $variables }) => $variables.b === 5
);

// functions

assert(
    'function',
    [
        {'a': 4},
        {'c': {
            '$': [{ 'x': 0 }, {'y': 0}],
            '#': [
                { 'x': {'+': [{'&':'x'}, {'&':'y'}]} },
                { '&': 'x' }
            ]
        }  },
        {'d' : {'&': 'c', '$': [{ '&' : 'a' }, 2] } },
    ],
    {}, {},
    ({ $variables }) => $variables.d === 6
);


assertFail(
    'fn arg type check',
    [
        {'a': 4},
        {'c': {
            '$': [{ 'x': '' }, {'y': 0}],
            '#': [
                { 'x': {'+': [{'&':'x'}, {'&':'y'}]} },
                { '&': 'x' }
            ]
        }  },
        {'d' : {'&': 'c', '$': [{ '&' : 'a' }, 2] } },
    ],
    {}, {},
    /Wrong argument type.*string.*number/i
);

// arrays

assert(
    'array',
    [
        {'a': 4},
        {'c': [1, 2, 3, {'&': 'a'}]},
        {'d': {'$': {'&' : 'c' }}},
        {'e': {'->': {'&': 'c' }}},
        {'f': {'+>': [{'&': 'e'}, 5]}}
    ],
    {}, {},
    ({ $variables }) => JSON.stringify($variables) == JSON.stringify({a: 4, c:[1, 2, 3, 4], d:4, e:[1, 2, 3], f:[5, 1, 2, 3]})
);

assert(
    'array len loop',
    [
        {'a': [1, 2, 3, 4]},
        {'b': []},
        {'c': 0},
        {
            '?': {'$': {'&' : 'a'}},
            '@': [
                {'c': {'+': [{'&': 'c'}, 1]}},
                {'b': {'<+': [{'&': 'b'}, {'.': [ {'&': 'a'}, 0 ]}] } },
                {'a': {'<-': {'&' : 'a'}}}
            ]
        }
    ],
    {}, {},
    ({ $variables }) => (
        JSON.stringify($variables.b) === JSON.stringify([1, 2, 3, 4]) &&
        JSON.stringify($variables.a) === JSON.stringify([]) &&
        $variables.c === 4
    )
);

assert(
    'array for loop',
    [
        {'a': [1, 2, 3, 4]},
        {'b': []},
        {'c': 0},
        {
            '?': {'<': [{'&': 'c'}, {'$': {'&' : 'a'}}]},
            '@': [
                {'c': {'+': [{'&': 'c'}, 1]}},
                {'b': {'<+': [{'&': 'b'}, {'.': [ {'&': 'a'}, {'&': 'c'} ]}] } },
            ]
        }
    ],
    {}, {},
    ({ $variables }) => (
        JSON.stringify($variables.b) === JSON.stringify([2, 3, 4, null]) &&
        JSON.stringify($variables.a) === JSON.stringify([1, 2, 3, 4]) &&
        $variables.c === 4
    )
);