
const juck = (input, functions = {}, vars = {}, lineNum = 0, callerLineNum = 0) =>
    Array.isArray(input) ? input.map((line, i) => typeof line != 'object' ? line : exec(line, functions, vars, lineNum + i + 1)) :
    typeof input === 'object' ? exec(input, functions, vars, lineNum) :
    input;

const exec = (block, functions, vars, lineNum, callerLineNum) => {

    const keys = Object.keys(block),
        keylen = keys.length,
        value = keylen == 1 && block[keys[0]];

    if ('$' in block) {
        if ('&' in block) {
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
        } else {
            const length = juck(block['$'], functions, vars, lineNum).length;
            if (typeof length == 'undefined') throw `Error in block ${lineNum}:\n${JSON.stringify(block)}\nLength ($) called on object of type '${typeof block['$']}'`;
            return length;
        }
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
            if (juck(block['?'], functions, vars)) {
                return juck(block[':'], functions, vars);
            }
            return false;
        }
    }

    for (const key of keys) {
        const op = key.match(/^(\!|\?|\.|\==|\!=|\<|\>|\<=|\>=|\-|\%|\&\&|\|\||\+|\*|\/|\^|\&|<[+-]|[+-]>)$/);
        if (!op) continue;

        if (key.match(/^(<[+-]|[+-]>)$/)) {
            let val;
            if (key == '->' || key == '<-') {
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

        switch (key) {
            case '!'  /* not  */ : return value.map ? value.map(e => !e) : !value;
            case '.'  /* prop */ : return value.reduce((a, c) => a[juck(c, functions, vars)], juck(value[0], functions, vars));
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
            case '+'  /* sum  */ : return value.reduce((a, c) => a + juck(c, functions, vars), 0);
            case '*'  /* mul  */ : return value.reduce((a, c) => a * juck(c, functions, vars), 1);
            case '/'  /* div  */ : return value.reduce((a, c) => a / juck(c, functions, vars), 1);
            case '^'  /* xor  */ : return value.reduce((a, c) => a ^ juck(c, functions, vars), 0);
            case '&'  /* ref  */ :
                if (typeof vars[value] == 'undefined') {
                    throw `Error in block ${lineNum}:\n${JSON.stringify(block)}\nUndefined variable name '${value}'`;
                }
                return vars[value];
            default:
                throw `Error in block ${lineNum}:\n${JSON.stringify(block)}\n${op[1]} is an unrecognized operator`;
        }
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
