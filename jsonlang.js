
function juck(input, functions = {}, vars = {}, lineNum = 0, callerLineNum = 0) {

    if (typeof input === 'string' && input.length > 1 && input[0] == '$') { // variable
        return vars[input];
    }

    if (Array.isArray(input)) { // array, possibly containing live code
        return input.map((line, i) => typeof line == 'number' ? line : juck(line, functions, vars, lineNum + i + 1)); // fast path for numbers
    }

    if (typeof input == 'object') { // object, possibly an instruction tree
        return exec(input, functions, vars, lineNum);
    }

    return input;
}

function exec(block, functions, vars, lineNum, callerLineNum) {

    if (block == null) return block;

    const keys = Object.keys(block),
        keylen = keys.length,
        value = keylen == 1 && block[keys[0]];

    if ('$' in block) {
        if ('&' in block) { // function call

            const fn = functions[block['&']],
                params = {},
                types = {};

            block['$'].map((arg, i) => { // evaluate parameters
                const argkey = Object.keys(fn.params[i])[0];
                params[argkey] = juck(arg, functions, vars);
                if (typeof params[argkey] != typeof fn.params[i][argkey]) {
                    throw `Error in block ${lineNum}:\n${JSON.stringify(block)}\nWrong argument type for '${argkey}', expecting ${typeof fn.params[i][argkey]}, got ${typeof params[argkey]}`;
                }
            });

            const results = { ...params },
                procedure = juck(fn.body, functions, results, 0, lineNum); // call
            return procedure.length ? procedure[procedure.length - 1] : void 0; // pop run stack

        } else { // length operator
            const length = juck(block['$'], functions, vars, lineNum).length;
            if (typeof length == 'undefined') throw `Error in block ${lineNum}:\n${JSON.stringify(block)}\nLength ($) called on object of type '${typeof block['$']}'`;
            return length;
        }
    }

    if ('?' in block) {
        if ('@' in block) { // loop
            let condition;
            do {
                if (condition = juck(block['?'], functions, vars)) { // = and not == intentionally
                    juck(block['@'], functions, vars);
                }
            } while (condition);
            return block;

        } else if (':' in block) { // conditional
            if (juck(block['?'], functions, vars)) {
                return juck(block[':'], functions, vars);
            }
            return false;
        }
    }

    for (const key of keys) {
        const op = key.match(/^(\!|\?|\.|\==|\!=|\<|\>|\<=|\>=|\-|\%|\&\&|\|\||\+|\*|\/|\^|\&|<[+-]|[+-]>)$/); // n-ary operators
        if (!op) continue;

        if (key.match(/^(<[+-]|[+-]>)$/)) { // stack/queue ops
            let val;
            if (key.indexOf('-') != -1) {
                val = juck(block[key], functions, JSON.parse(JSON.stringify(vars)));
                if      (key == '->') val.pop();
                else if (key == '<-') val.shift();
            
            } else {
                val = juck(block[key][0], functions, JSON.parse(JSON.stringify(vars)));
                block[key].slice(1)
                    .map(op => juck(op, functions, JSON.parse(JSON.stringify(vars))))
                    .map(op => {
                        if      (key == '+>') val.unshift(juck(block[key][1], functions, vars));
                        else if (key == '<+') val.push(juck(block[key][1], functions, vars));
                    });
            }
            return val;
        }

        switch (key) { // logical, comparison and arithmetic ops
            case '!'  /* not  */ : return value.map ? value.map(e => !e) : !value;
            case '.'  /* prop */ : return value.slice(1).reduce((a, c) => a[juck(c, functions, vars)], juck(value[0], functions, vars));
            case '==' /* eq   */ : return value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (a == d) && d, value[0]) && true;
            case '!=' /* neq  */ : return value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (d == null || d != a) && d, null) && true;
            case '<'  /* lt   */ : return value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (a < d) && d, -Infinity) && true;
            case '>'  /* gt   */ : return value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (a > d) && d, Infinity) && true;
            case '<=' /* lte  */ : return value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (a <= d) && d, 0) && true;
            case '>=' /* gte  */ : return value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (a >= d) && d, 0) && true;
            case '-'  /* diff */ : return value.slice(1).reduce((a, c) => a - juck(c, functions, vars), juck(value[0], functions, vars));
            case '%'  /* mod  */ : return value.slice(1).reduce((a, c) => a % juck(c, functions, vars), juck(value[0], functions, vars));
            case '&&' /* and  */ : return value.reduce((a, c) => a && juck(c, functions, vars), 1) >= 1;
            case '||' /* or   */ : return value.reduce((a, c) => a || juck(c, functions, vars), 0) >= 1;
            case '+'  /* sum  */ : return value.slice(1).reduce((a, c) => a + juck(c, functions, vars), juck(value[0], functions, vars));
            case '*'  /* mul  */ : return value.reduce((a, c) => a * juck(c, functions, vars), 1);
            case '/'  /* div  */ : return value.reduce((a, c) => a / juck(c, functions, vars), 1);
            case '^'  /* xor  */ : return value.reduce((a, c) => a ^ juck(c, functions, vars), 0);
            default: // should be unreachable
                throw `Error in block ${lineNum}:\n${JSON.stringify(block)}\n${op[1]} is an unrecognized operator`;
        }
    }

    for (const prop in block) {

        if (typeof block[prop] == 'object' && block[prop]) {
            if ('#' in block[prop]) {
                if (prop[0] != '$') throw `Error in block ${lineNum}:\n${JSON.stringify(block)}\nFunction name must start with a $`;

                functions[prop] = {
                    body: block[prop]['#'],
                    params: block[prop]['$'],
                };
            }
        }

        if (prop.length > 1 && prop[0] == '$') {
            const result = juck(block[prop], functions, vars, lineNum);
            if (result != null) {
                const type1 = typeof vars[prop], type2 = typeof result;
                if (type1 != 'undefined' && type1 != type2) {
                    throw `Error in block ${lineNum}:\n${JSON.stringify(block)}\nAssigning ${type2} value to variable ${prop}, previously declared as ${type1}`;
                }
            }
            vars[prop] = result;
        }
    }

    return block;
}

exports.juck = juck;
