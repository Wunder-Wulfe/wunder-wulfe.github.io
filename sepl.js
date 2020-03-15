var exit = false;

function setHTML(element, contents) {
  element.innerHTML = contents + "<br\>";
}

function printHTML(element, contents) {
  element.innerHTML += contents + "<br\>";
}

function printVal(element, contents) {
  element.innerHTML += contents;
}

function err(text) {
  printHTML(outp, '<span class="oerr">' + text + '<\/span>');
  return false;
}

function stko(stk) {
  return stk.join(' ');
}

function clear(arr) {
  while (arr.length) arr.pop();
}

function BAD_CODE() {
  exit = true;
  return err(`process aborted`);
}
const kwds = {
  def: 'v',
  arr: 'r',
  idx: 'i',
  psh: 'P',
  put: 'I',
  pop: 'R',
  len: 'W',
  set: 'x',
  out: 'o',
  say: 'e',
  eq: 'q',
  neq: 'Q',
  gt: 'g',
  gte: 'G',
  lt: 'l',
  lte: 'L',
  and: 'A',
  or: 'O',
  not: 'n',
  neg: 'N',
  shf: 'h',
  inc: 'a',
  dec: 's',
  mul: 'm',
  div: 'd',
  pow: 'p',
  int: 'f',
  sgn: 'S',
  mod: 'M',
  for: 'F',
  end: 'E'
}
const jnrs = {
  to: 0,
  frm: 1,
  by: 2,
  as: 3,
  wth: 4,
  at: 5,
  in: 6
}

function ismark(vrb) {
  return vrb == '##';
}

function isstr(item) {
  return !!item.match(/(['"])[\s\S]?\1/);
}

function isvar(item) {
  return isNaN(item * 1) && !(item in kwds) && !(item in jnrs) && !ismark(item) && !!item.match(/^[_a-z][\w_]*?$/i);
}

function isval(item) {
  return !isNaN(item * 1);
}
const ARRAY_TYPE = 0;
const NUMBER_TYPE = 1;
const jnrchr = 'j';

function iskwd(kwd) {
  return kwd in kwds;
}

function isjnr(jnr) {
  return jnr in jnrs;
}
// Errors
const ERROR_REDEF = 0;
const ERROR_UNDEF = 1;
const ERROR_UNSPT = 2;
const ERROR_EXVAR = 3;
const ERROR_EXARR = 4;
const ERROR_EXVAL = 5;
const ERROR_FORLP = 6;
const ERROR_FREND = 7;
const ERROR_EXJNR = 8;
const ERROR_EXKWD = 9;
// Handler
const exists = val => val !== undefined;
const nexists = val => val === undefined;
const state = {};

function ERROR(value, reason) {
  let linedata = exists(state.line) ? `line ${state.line}: ` : ``;
  let stackdata = exists(state.stack) ? ` (stack trace: ${stko(state.stack)})` : ``;
  let textdata = ``;
  switch (reason) {
    case ERROR_REDEF:
      textdata = `redefinition of existing variable '${value}'`;
      break;
    case ERROR_UNDEF:
      textdata = `undefined variable '${value}'`
      break;
    case ERROR_UNSPT:
      textdata = `unsupported keyword ${value}`;
      break;
    case ERROR_EXVAR:
      textdata = `expected a variable, got ${value}`;
      break;
    case ERROR_EXARR:
      textdata = `expected an array, got ${value}`;
      break;
    case ERROR_EXVAL:
      textdata = `expected a value, got ${value}`;
      break;
    case ERROR_FORLP:
      textdata = `mismatched for loop`;
      break;
    case ERROR_FREND:
      textdata = `mismatched end`;
      break;
    case ERROR_EXJNR:
      textdata = `expected a joiner, got ${value}`;
      break;
    case ERROR_EXKWD:
      textdata = `expected a keyword, got ${value}`;
      break;
  }
  err(linedata + textdata + stackdata);
  return true;
}
// SCOPING
function ENTERSCOPE() {
  state.register.push([]);
  state.vars.push({});
  state.scope++;
  return true;
}

function LEAVESCOPE() {
  if (state.scope == 0) return err(`scoping error at ${state.line}`);
  state.register.pop();
  state.vars.pop();
  state.scope--;
  return true;
}

function VARTOSCOPE(varname, vartype) {
  state.vars[state.scope][varname] = state.register[state.scope].length;
  state.register[state.scope].push(vartype);
}
const VARINSCOPE = varname => varname in state.vars[state.scope];

function GETVARSCOPE(varname) {
  let scope = state.scope;
  let scopec = state.vars[state.scope];
  while (!(varname in scopec) && scope > 0)
    scopec = state.vars[--scope];
  return varname in scopec ? scope : undefined;
}
const GETVARPTR = (varname, scope) => scope + '*' + state.vars[scope][varname];
//const GETVARVAL = (varname, scope) => state.register[scope][2 * state.vars[scope][varname]];
const GETVARTYPE = (varname, scope) => state.register[scope][state.vars[scope][varname]];

function ASVALUE(item) {
  //console.log(item,isvar(item));
  if (nexists(item) || iskwd(item) || ismark(item)) {
    return undefined;
  } else if (isstr(item)) {
    return item.length == 2 ? 0 : item.charCodeAt(1);
  } else if (isval(item)) {
    return item * 1;
  } else if (isvar(item)) {
    let scope = GETVARSCOPE(item)
    if (nexists(scope)) return false;
    return GETVARPTR(item, scope);
  } else {
    return undefined;
  }
}
// PUSH
const NEWVARIABLE = 0;
const VARIABLE = 1;
const NEWARRAY = 2;
const ARRAY = 3;
const VALUE = 4;
const JOINER = 5;
const IMPLICIT_JOINER = 6;
// Returns whether or not it failed
// if (PUSH(...)) return false;
function PUSHAUTO(phrase) {
  state.comp += phrase;
  state.i++;
}
const STRJ = str => JSON.stringify(str);

function PUSH(...phrases) {
  console.log(`I ${state.i} KWD ${state.matches[state.i]} SCOPE ${state.scope} PHRASES ${phrases} VARS ${STRJ(state.vars)} REGISTERS ${STRJ(state.register)}`);
  let item, n, scope;
  for (n = 0; n < phrases.length; n++) {
    item = state.matches[++state.i];
    while (item == "##") item = state.matches[++state.i];
    state.stack.push(item);
    switch (phrases[n]) {
      case NEWVARIABLE:
        if (nexists(item)) return ERROR(`nothing`, ERROR_EXVAR);
        if (!isvar(item)) return ERROR(item, ERROR_EXVAR);
        if (VARINSCOPE(item)) return ERROR(item, ERROR_REDEF);
        state.comp += state.register[state.scope].length;
        VARTOSCOPE(item, NUMBER_TYPE);
        break;
      case NEWARRAY:
        if (nexists(item)) return ERROR(`nothing`, ERROR_EXARR);
        if (!isvar(item)) return ERROR(item, ERROR_EXVAR);
        if (VARINSCOPE(item)) return ERROR(item, ERROR_REDEF);
        state.comp += state.register[state.scope].length;
        VARTOSCOPE(item, ARRAY_TYPE);
        break;
      case VARIABLE:
        if (nexists(item)) return ERROR(`nothing`, ERROR_EXVAR);
        if (!isvar(item)) return ERROR(item, ERROR_EXVAR);
        scope = GETVARSCOPE(item);
        //console.log(scope);
        if (nexists(scope)) return ERROR(item, ERROR_UNDEF);
        if (GETVARTYPE(item, scope) !== NUMBER_TYPE) return ERROR(`array ${item}`, ERROR_EXVAR);
        state.comp += GETVARPTR(item, scope);
        break;
      case ARRAY:
        if (nexists(item)) return ERROR(`nothing`, ERROR_EXARR);
        if (!isvar(item)) return ERROR(item, ERROR_EXARR);
        scope = GETVARSCOPE(item);
        if (nexists(scope)) return ERROR(item, ERROR_UNDEF);
        if (GETVARTYPE(item, scope) !== ARRAY_TYPE) return ERROR(item, ERROR_EXARR);
        state.comp += GETVARPTR(item, scope);
        break;
      case VALUE:
        scope = exists(item) ? ASVALUE(item) : undefined;
        if (nexists(scope)) return ERROR(item, ERROR_EXVAL);
        if (scope === false) return ERROR(item, ERROR_UNDEF);
        state.comp += scope;
        break;
      case JOINER:
        if (nexists(item)) return ERROR(`nothing`, ERROR_EXJNR);
        if (!isjnr(item)) return ERROR(item, ERROR_EXJNR);
        state.comp += jnrchr;
        break;
      case IMPLICIT_JOINER:
        state.comp += jnrchr;
        break;
      default:
        return !err("unexpected PUSH parameters");
    }
  }
  return false;
}

function compile() {
  let text = typer.value
    .replace(/(#(?:\\\#|\\\n|[^\n#])*#?)/g, '')
    .replace(/\\n/g, '10')
    .replace(/\\t/g, '9')
    .replace(/\btrue\b/g, '1')
    .replace(/\bfalse\b/g, '0');
  printHTML(outp, text);
  text = text.replace(/\n/g, ' ## ');
  state.matches = text.match(/((['"])(?:[\s\S]?|&.+;)(?:\2))|(\S+)/ig);
  state.comp = "";
  if (state.matches) {
    state.stack = [];
    state.register = [
      []
    ];
    state.vars = [{}];
    state.i = 0;
    state.scope = 0;
    state.forlevel = 0;
    state.line = 1;
    state.scope = 0;
    let item;
    while (state.i < state.matches.length) {
      item = state.matches[state.i];
      //printHTML(outp,`${i} : ${item} ${matches[i + 1]} ${matches[i + 2]}`);
      state.stack.push(item);
      if (item in kwds) {
        state.comp += kwds[item];
        switch (kwds[item]) {
          //definition
          case kwds.arr:
          case kwds.def:
            let isarray = kwds[item] === kwds.arr;
            if (PUSH(isarray ? NEWARRAY : NEWVARIABLE)) return false;
            break;
            //variable push
          case kwds.sgn:
          case kwds.int:
          case kwds.not:
          case kwds.neg:
            if (PUSH(VARIABLE)) return false;
            break;
            //value push
          case kwds.out:
          case kwds.say:
            if (PUSH(VALUE)) return false;
            break;
            //variable joiner value push
          case kwds.neq:
          case kwds.gt:
          case kwds.gte:
          case kwds.lt:
          case kwds.lte:
          case kwds.and:
          case kwds.or:
          case kwds.xor:
          case kwds.shf:
          case kwds.inc:
          case kwds.dec:
          case kwds.mul:
          case kwds.div:
          case kwds.pow:
          case kwds.mod:
          case kwds.set:
          case kwds.eq:
            if (PUSH(VARIABLE, JOINER, VALUE)) return false;
            break;
            //array joiner variable push
          case kwds.len:
          case kwds.pop:
            if (PUSH(ARRAY, JOINER, VARIABLE)) return false;
            break;
            //value joiner array
          case kwds.psh:
            if (PUSH(VALUE, JOINER, ARRAY)) return false;
            break;
            //value joiner array joiner value
          case kwds.put:
            if (PUSH(VALUE, JOINER, ARRAY, JOINER, VALUE)) return false;
            break;
            //array joiner value joiner variable push
          case kwds.idx:
            if (PUSH(ARRAY, JOINER, VALUE, JOINER, VARIABLE)) return false;
            break;
            //forlevel implicit_joiner vairable push
          case kwds.for:
            PUSHAUTO(state.forlevel++);
            PUSHAUTO(jnrchr);
            state.i -= 2;
            if (PUSH(VARIABLE)) return false;
            ENTERSCOPE();
            break;
            //forlevel push
          case kwds.end:
            PUSHAUTO(--state.forlevel);
            state.i--;
            LEAVESCOPE();
            break;
          default:
            return !ERROR(item, ERROR_UNSPT);
        }
      } else if (item == '##') {
        state.line++;
      } else {
        return !ERROR(item, ERROR_EXKWD);
      }
      clear(state.stack);
      state.i++;
    }
    if (state.stack.length) return unexp(state.stack);
    if (state.forlevel < 0) return !ERROR(undefined, ERROR_FORLP);
    if (state.forlevel > 0) return !ERROR(undefined, ERROR_FREND);
  }
  //alert("final process: " + matches);
  //alert("compilation result: " + comp);
  printHTML(outp, "result: " + state.comp);
  return state.comp;
}
const runstate = {};

function GRABVAL(item) {
  if (!isNaN(1 * item)) return 1 * item;
  let find = item.match(/(\d+)\*(\d+)/);
  return runstate.stack[find[1]][find[2]];
}

function VARNEW(id) {
  runstate.stack[runstate.scope][id] = 0;
}

function ARRNEW(id) {
  runstate.stack[runstate.scope][id] = [];
}

function VARASGN(item, val) {
  let find = item.match(/(\d+)\*(\d+)/);
  runstate.stack[find[1]][find[2]] = val;
}

function ARRYGET(item) {
  let find = item.match(/(\d+)\*(\d+)/);
  return runstate.stack[find[1]][find[2]];
}

function UPSCOPE() {
  runstate.stack.push([]);
  runstate.scope++;
}

function DWSCOPE() {
  runstate.stack.pop();
  runstate.scope--;
  if (runstate.scope < 0) alert(`OOF SCOPE`);
}
const PULL = () => runstate.matches[runstate.i++];

function interpret(result) {
  runstate.matches = result.match(/[a-z]|\d+\*\d+|[\-\.\d]+/ig);
  if (runstate.matches) {
    let p, v;
    let item;
    runstate.stack = [
      []
    ];
    runstate.scope = 0;
    runstate.i = 0;
    let iterations = 0;
    while (runstate.i < runstate.matches.length) {
      if (exit) return;
      item = PULL();
      //printHTML(outp, `${runstate.i} : ${item} ${runstate.matches[runstate.i+1]} ${runstate.matches[runstate.i+2]} ${runstate.matches[runstate.i+3]}`);
      switch (item) {
        case kwds.def:
          VARNEW(PULL());
          break;
        case kwds.arr:
          ARRNEW(PULL());
          break;
        case kwds.out:
          p = GRABVAL(PULL())
          printVal(outp, exists(p) ? p : 0);
          break;
        case kwds.say:
          v = GRABVAL(PULL())
          p = String.fromCharCode(exists(v) ? v : 0);
          if (p == '\n') p = '<br\>';
          else if (p == '\t') p = '&emsp;';
          printVal(outp, p);
          break;
        case kwds.set:
          p = PULL();
          PULL();
          VARASGN(p, GRABVAL(PULL()));
          break;
        case kwds.not:
          p = PULL();
          VARASGN(p, !GRABVAL(p) ? 1 : 0);
          break;
        case kwds.neg:
          p = PULL();
          VARASGN(p, ~GRABVAL(p));
          break;
        case kwds.eq:
          p = PULL();
          PULL();
          VARASGN(p, GRABVAL(p) === GRABVAL(PULL()) ? 1 : 0);
          break;
        case kwds.neq:
          p = PULL();
          PULL();
          VARASGN(p, GRABVAL(p) !== GRABVAL(PULL()) ? 1 : 0);
          break;
        case kwds.gt:
          p = PULL();
          PULL();
          VARASGN(p, GRABVAL(p) > GRABVAL(PULL()) ? 1 : 0);
          break;
        case kwds.gte:
          p = PULL();
          PULL();
          VARASGN(p, GRABVAL(p) >= GRABVAL(PULL()) ? 1 : 0);
          break;
        case kwds.lt:
          p = PULL();
          PULL();
          VARASGN(p, GRABVAL(p) < GRABVAL(PULL()) ? 1 : 0);
          break;
        case kwds.lte:
          p = PULL();
          PULL();
          VARASGN(p, GRABVAL(p) <= GRABVAL(PULL()) ? 1 : 0);
          break;
        case kwds.and:
          p = PULL();
          PULL();
          VARASGN(p, GRABVAL(p) & GRABVAL(PULL()));
          break;
        case kwds.or:
          p = PULL();
          PULL();
          VARASGN(p, GRABVAL(p) | GRABVAL(PULL()));
          break;
        case kwds.xor:
          p = PULL();
          PULL();
          VARASGN(p, GRABVAL(p) ^ GRABVAL(PULL()));
          break;
        case kwds.shf:
          p = PULL();
          PULL();
          v = GRABVAL(PULL())
          VARASGN(p, v > 0 ? GRABVAL(p) >> v : GRABVAL(p) << -v);
          break;
        case kwds.inc:
          p = PULL();
          PULL();
          VARASGN(p, GRABVAL(p) + GRABVAL(PULL()));
          break;
        case kwds.dec:
          p = PULL();
          PULL();
          VARASGN(p, GRABVAL(p) - GRABVAL(PULL()));
          break;
        case kwds.mul:
          p = PULL();
          PULL();
          VARASGN(p, GRABVAL(p) * GRABVAL(PULL()));
          break;
        case kwds.div:
          p = PULL();
          PULL();
          VARASGN(p, GRABVAL(p) / GRABVAL(PULL()));
          break;
        case kwds.pow:
          p = PULL();
          PULL();
          VARASGN(p, Math.pow(GRABVAL(p), GRABVAL(PULL())));
          break;
        case kwds.int:
          p = PULL();
          VARASGN(p, Math.floor(GRABVAL(p)));
          break;
        case kwds.sgn:
          p = PULL();
          VARASGN(p, Math.sign(GRABVAL(p)));
          break;
        case kwds.mod:
          p = PULL();
          PULL();
          VARASGN(p, GRABVAL(p) % GRABVAL(PULL()));
          break;
        case kwds.psh:
          p = PULL();
          PULL();
          ARRYGET(PULL()).push(GRABVAL(p));
          break;
        case kwds.pop:
          p = ARRYGET(PULL());
          PULL();
          v = p.pop();
          VARASGN(PULL(), exists(v) ? v : 0);
          break;
        case kwds.put:
          p = GRABVAL(PULL());
          PULL();
          v = ARRYGET(PULL());
          PULL();
          v[GRABVAL(PULL())] = p;
          break;
        case kwds.len:
          p = ARRYGET(PULL());
          PULL();
          VARASGN(PULL(), p.length);
          break;
        case kwds.idx:
          p = ARRYGET(PULL());
          PULL();
          v = GRABVAL(PULL());
          PULL();
          VARASGN(PULL(), p[v]);
          break;
        case kwds.for:
          p = PULL();
          PULL();
          //printHTML(outp,`VPOS ${matches[i]}`);
          item = PULL();
          //console.log(item, GRABVAL(item));
          if (GRABVAL(item) === 0) {
            while (runstate.matches[runstate.i - 1] !== kwds.end || runstate.matches[runstate.i] !== p) {
              iterations++;
              if (iterations > 10000000) BAD_CODE();
              if (exit) return;
              runstate.i++;
            }
            runstate.i++;
          } else {
            UPSCOPE();
          }
          //alert(`scope for ${runstate.scope} ${STRJ(runstate.stack)}`);
          break
        case kwds.end:
          p = PULL();
          //console.log(p);
          DWSCOPE();
          //alert(`scope end ${runstate.scope} ${STRJ(runstate.stack)}`);
          while (runstate.matches[runstate.i + 1] !== kwds.for || runstate.matches[runstate.i + 2] !== p) {
            //console.log(runstate.i, runstate.matches[runstate.i + 1], runstate.matches[runstate.i + 2]);
            iterations++;
            if (iterations > 10000000) BAD_CODE();
            if (exit) return;
            runstate.i--;
          }
          runstate.i++;
          break;
        default:
          return err(`runtime OOF at ${runstate.matches[runstate.i]}`);
      }
    }
  }
}

function exec() {
  exit = true;
  setHTML(outp, new Date());
  printHTML(outp, "compiling your program...");
  let result = compile();
  if (result !== false) {
    printHTML(outp, "running your program...");
    exit = false;
    //let interval = setTimeout(BAD_CODE, 2000);
    interpret(result);
    //clearTimeout(interval);
  } else {
    err("compilation failed")
  }
}

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
const defcd = `def foo
def bar
set bar to 2
set foo to bar
out foo`;

function colorize(elem, val, care_for_spaces) {
  //document.cookie = "text=" + encodeURIComponent(typer.value);
  //printHTML(outp, getCookie("text"));
  elem.style.fontSize = "1.15em";
  elem.innerHTML = val;
  if (care_for_spaces)
    elem.innerHTML = elem.innerHTML.replace(/ /g, '&nbsp;');
  elem.innerHTML = elem.innerHTML
    //.replace(/([^\w\s#]+)/g,'<span class="er" id="mini">$1<\/span>'
    .replace(/\b(true|false)\b/g, '<span class="bo df" id="mini">$1<\/span>')
    .replace(/\b(to|by|frm|as|wth|at|in)\b/g, '<span class="op df" id="mini">$1<\/span>')
    .replace(/\b(inc|dec|mul|div|pow|mod)\b/g, '<span class="ar df" id="mini">$1<\/span>')
    .replace(/\b(n?eq|gte?|lte?|and|x?or|not|neg|shf)\b/g, '<span class="bl df" id="mini">$1<\/span>')
    .replace(/\b(def|set)\b/g, '<span class="pw df" id="mini">$1<\/span>')
    .replace(/\b(arr|idx|len|psh|pop|put)\b/g, '<span class="arr df" id="mini">$1<\/span>')
    .replace(/\b(for|end)\b/g, '<span class="fr df" id="mini">$1<\/span>')
    .replace(/\b(out|say)\b/g, '<span class="io df" id="mini">$1<\/span>')
    .replace(/\b(int|sgn)\b/g, '<span class="lb df" id="mini">$1<\/span>')
    .replace(/((['"])(?:.?|&.+;)(?:\2))/g, '<span class="str" id="mini">$1<\/span>')
    .replace(/\b(\d+\.\d+|\d+\.?|\.\d+)\b/g, '<span class="num df" id="mini">$1</span>')
    .replace(/(#(?:\\\#|\\\n|[^\n#])*#?)/g, '<i class="cm">$1<\/i>')
    .replace(/(\\[nt])/g, '<span class="sp df" id="mini">$1</span>')
    .replace(/\n/g, '<br/>')
    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');;
  elem.innerHTML += "<br>";
}
var prvtext;
var encodedtext;

function highlight() {
  encodedtext = encodeURIComponent(typer.value);
  document.cookie = "text=" + encodedtext;
  if (prvtext !== typer.value) {
    exportfile.href = 'data:text/plain;charset=UTF-8,' + encodedtext;
    colorize(coder, typer.value, true);
    lines.innerHTML = "";
    let i;
    let mtch = typer.value.match(/\n/g);
    let ln = mtch ? mtch.length : 0;
    for (i = 0; i <= ln; i++) {
      lines.innerHTML += i + 1;
      if (i < ln)
        lines.innerHTML += "<br/>";
    }
  }
  prvtext = typer.value
}

setInterval(highlight, 250)

pressbtn.onclick = exec;

if (getCookie("text")) {
  printHTML(outp, "loading saved script...");
  typer.value = getCookie("text");
} else {
  printHTML(outp, "loading default script...");
  document.cookie = "text=" + encodeURIComponent(defcd);
  typer.value = defcd;
}
printHTML(outp, "SEPL interpreter v1.9")

docs.onclick = function() {
  return false;
}

var telems = tbls.querySelectorAll("td[highlight='']");
var count = 0;
for (count = 0; count < telems.length; count++) {
  colorize(telems[count], telems[count].innerHTML, false);
}

function enableTab(id) {
  var el = document.getElementById(id);
  el.onkeydown = function(e) {
    if (e.keyCode === 9) { // tab was pressed

      // get caret position/selection
      var val = this.value,
        start = this.selectionStart,
        end = this.selectionEnd;

      // set textarea value to: text before caret + tab + text after caret
      this.value = val.substring(0, start) + '\t' + val.substring(end);

      // put caret at right position again
      this.selectionStart = this.selectionEnd = start + 1;

      // prevent the focus lose
      return false;

    }
  };
}

// Enable the tab character onkeypress (onkeydown) inside textarea...
// ... for a textarea that has an `id="my-textarea"`
enableTab('typer');

pressimp.onclick = function() {
  pressimpd.click();
}

function readTextFile(file) {
  const objectURL = window.URL.createObjectURL(file);
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", objectURL, false);
  rawFile.onreadystatechange = function() {
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status == 0) {
        var allText = rawFile.responseText;
        window.URL.revokeObjectURL(objectURL);
        typer.value = allText;
      }
    }
  }
  rawFile.send(null);
}

var prvfile = pressimpd.value;
pressimpd.onchange = function() {
  if (prvfile !== pressimpd.value) {
    readTextFile(pressimpd.files[0]);
  }
  prvfile = pressimpd.value;
}
/*
const str = "";
pupper.onhover = function() {
	var snd = new Audio();
  snd.src = str;
  snd.volume = vol;
  snd.play();
}
*/
