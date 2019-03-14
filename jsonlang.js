
const juck = (input, functions = {}, vars = {}, lineNum = 0, callerLineNum = 0) =>
    Array.isArray(input) ? input.map((line, i) => exec(line, functions, vars, lineNum + i + 1)) :
    typeof input === 'object' ? exec(input, functions, vars, lineNum) :
    input;

const exec = (block, functions, vars, lineNum, callerLineNum) => {

    const keys = Object.keys(block),
        keylen = keys.length,
        value = keylen == 1 && block[keys[0]],
        operations = {
            /* not  */ '!'  : () => value.map ? value.map(e => !e) : !value,
            /* if   */ '?'  : () => juck(block[juck(block['?'])|0], functions, vars, lineNum),
            /* prop */ '.'  : () => value.reduce((a, c) => a[juck(c, functions, vars)], juck(value[0], functions, vars)),
            /* eq   */ '==' : () => value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (a == d) && d, value[0]),
            /* neq  */ '!=' : () => value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (d == null || d != a) && d, null),
            /* lt   */ '<'  : () => value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (a < d) && d, -Infinity),
            /* gt   */ '>'  : () => value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (a > d) && d, Infinity),
            /* lte  */ '<=' : () => value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (a <= d) && d, 0),
            /* gte  */ '>=' : () => value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (a >= d) && d, 0),
            /* diff */ '-'  : () => value.slice(1).reduce((a, c) => a - juck(c, functions, vars), juck(value[0], functions, vars)),
            /* mod  */ '%'  : () => value.slice(1).reduce((a, c) => a % juck(c, functions, vars), juck(value[0], functions, vars)),
            /* and  */ '&&' : () => value.reduce((a, c) => a && juck(c, functions, vars), 1) >= 1,
            /* or   */ '||' : () => value.reduce((a, c) => a || juck(c, functions, vars), 0) >= 1,
            /* sum  */ '+'  : () => value.reduce((a, c) => a + juck(c, functions, vars), 0),
            /* mul  */ '*'  : () => value.reduce((a, c) => a * juck(c, functions, vars), 1),
            /* div  */ '/'  : () => value.reduce((a, c) => a / juck(c, functions, vars), 1),
            /* xor  */ '^'  : () => value.reduce((a, c) => a ^ juck(c, functions, vars), 0),
            /* ref  */ '&'  : () => vars[value],
            };

    if ('&' in block && '$' in block) {
        const fn = functions[block['&']];
        const params = {};
        const types = {};
        block['$'].map((arg, i) => {
            const argkey = Object.keys(fn.params[i])[0];
            params[argkey] = juck(arg, functions, vars);

            if (typeof params[argkey] != typeof fn.params[i][argkey]) {
                throw `Error in block ${lineNum}:\n${JSON.stringify(block)}\nWrong argument type for '${argkey}', expecting ${typeof fn.params[i][argkey]}, got ${typeof params[argkey]}`;
            }
        });
        const results = { ...fn.params, ...params };
        const procedure = juck(fn.body, functions, results, 0, lineNum);
        return procedure.length ? procedure[procedure.length - 1] : void 0;
    }

    if ('?' in block) {
        if ('@' in block) {
            let condition;
            do {
                if (condition = juck(block['?'], functions, vars)) { // assign!
                    juck(block['@'], functions, vars);
                }
            } while (condition);
            return block;
        } else if (':' in block) {
            juck(block[':'], functions, vars);
        }
    }

    for (const op in operations) {
        if (op in block) return operations[op]();
    }

    for (const prop in block) {
        if (typeof block[prop] == 'object' && '#' in block[prop]) {
            functions[prop] = {
                body: block[prop]['#'],
                params: block[prop]['$'],
            }
        } else {
            vars[prop] = juck(block[prop], functions, vars, lineNum);
        }
    }

    return value;
}

exports.juck = juck;
