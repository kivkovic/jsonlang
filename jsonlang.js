
const juck = (input, functions = {}, vars = {}, lineNum = 0, callerLineNum = 0) =>
    Array.isArray(input) ? input.map((line, i) => exec(line, functions, vars, lineNum + i + 1)) :
    typeof input === 'object' ? exec(input, functions, vars, lineNum) :
    input;

const exec = (block, functions, vars, lineNum, callerLineNum) => {

    const keys = Object.keys(block),
        keylen = keys.length,
        value = keylen == 1 && block[keys[0]];

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

    for (const key of keys) {
        const op = key.match(/^(\!|\?|\.|\==|\!=|\<|\>|\<=|\>=|\-|\%|\&\&|\|\||\+|\*|\/|\^|\&)$/);
        if (!op) continue;
        switch (op[1]) {
            case '!'  /* not  */ : return value.map ? value.map(e => !e) : !value;
            case '?'  /* if   */ : return juck(block[juck(block['?'])|0], functions, vars, lineNum);
            case '.'  /* prop */ : return value.reduce((a, c) => a[juck(c, functions, vars)], juck(value[0], functions, vars));
            case '==' /* eq   */ : return value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (a == d) && d, value[0]);
            case '!=' /* neq  */ : return value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (d == null || d != a) && d, null);
            case '<'  /* lt   */ : return value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (a < d) && d, -Infinity);
            case '>'  /* gt   */ : return value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (a > d) && d, Infinity);
            case '<=' /* lte  */ : return value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (a <= d) && d, 0);
            case '>=' /* gte  */ : return value.reduce((a, c, x, y, d = juck(c, functions, vars)) => (a >= d) && d, 0);
            case '-'  /* diff */ : return value.slice(1).reduce((a, c) => a - juck(c, functions, vars), juck(value[0], functions, vars));
            case '%'  /* mod  */ : return value.slice(1).reduce((a, c) => a % juck(c, functions, vars), juck(value[0], functions, vars));
            case '&&' /* and  */ : return value.reduce((a, c) => a && juck(c, functions, vars), 1) >= 1;
            case '||' /* or   */ : return value.reduce((a, c) => a || juck(c, functions, vars), 0) >= 1;
            case '+'  /* sum  */ : return value.reduce((a, c) => a + juck(c, functions, vars), 0);
            case '*'  /* mul  */ : return value.reduce((a, c) => a * juck(c, functions, vars), 1);
            case '/'  /* div  */ : return value.reduce((a, c) => a / juck(c, functions, vars), 1);
            case '^'  /* xor  */ : return value.reduce((a, c) => a ^ juck(c, functions, vars), 0);
            case '&'  /* ref  */ : return vars[value];
            default:
                throw `Error in block ${lineNum}:\n${JSON.stringify(block)}`;
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
