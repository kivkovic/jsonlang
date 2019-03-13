const juck = require('./jsonlang.js').juck;

const assert = (title, program, $functions, $variables, expression) => {
    $return = juck(eval(program), $functions, $variables);
    console.log(
        title,
        Array(80 - title.length).join('.'),
        expression({ $functions, $variables, $return }) ? 'OK' : ['ERROR', {$functions, $variables, $return}]
    );
}

// tests

assert('quine',
    1,
    {}, {},
    ({ $return }) => $return === 1
);

// variables

assert('init & assign',
    [{a:0}, {b:'a'}, {a:2}],
    {}, {},
    ({ $variables }) => $variables.a === 2 && $variables.b === 'a'
);

assert('ref assign',
    [{a:5}, {b: {'&':'a'}}],
    {}, {},
    ({ $variables }) => $variables.a === $variables.b
);

assert(
    'double pointer',
    [{'b':5}, {a: {'&':'b'}}, {'c': {'&':'a'}}],
    {}, {},
    ({ $variables }) => $variables.a === $variables.b && $variables.b === $variables.c
);

// nested member assignment...

// arithmetic

assert(
    'sum',
    [{'a':5}, {'b':{'+': [7, {'&':'a'}, 8, -2]}}],
    {}, {},
    ({ $variables }) => $variables.b === 18
);

assert(
    'diff',
    [{'a':5}, {'b':{'-': [{'&':'a'}, 7, 8, -2]}}],
    {}, {},
    ({ $variables }) => $variables.b === -8
);

assert(
    'mul',
    [{'a':5}, {'b':{'*': [7, {'&':'a'}, 8, -2]}}],
    {}, {},
    ({ $variables }) => $variables.b === -560
);

assert(
    'div',
    [{'a':5}, {'b':{'/': [7, {'&':'a'}, 8, -2]}}],
    {}, {},
    ({ $variables }) => $variables.b.toFixed(8) === (-0.0017857142857142857).toFixed(8)
);

assert(
    'mod',
    [{'a':59}, {'b':{'%': [701, {'&':'a'}, 19, -4]}}],
    {}, {},
    ({ $variables }) => $variables.b === 2
);

assert(
    'xor',
    [{'a':5}, {'b': {'^': [7, {'&':'a'}, 8, -2]}}],
    {}, {},
    ({ $variables }) => $variables.b === -12
);

// comparison...

// logical...

// if...

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

// functions...

/* assert(
    'functions',
    [ {'$a':5}, {'&':'fn1'} ],
    { 'fn1': [{'$a': {'+': [{'&':'a'}, 1]}}] }, {},
    () => 0
); */
