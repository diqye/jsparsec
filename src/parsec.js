/*
 * 暂不做模块化 
 */
function isGeneratorFunction(a){return Object.prototype.toString.call(a) == "[object GeneratorFunction]"}
function isGenerator(a){return Object.prototype.toString.call(a) == "[object Generator]"}
function isFunction(a){return Object.prototype.toString.call(a) == "[object Function]"}
function isArray(a){return Array.isArray(a)}
// function 约定 ctx -> (str,ctx) | error
function withContext(context) {
  let isEnd = false
  function runYieldSync(ge,val={done:false,value:undefined}){
    if (isEnd) {
      return val.value
    }if (isFunction(ge)) {
      let aval =  ge(context)
      if(isArray(aval)){
        context = aval[1]
        return aval[0]
      }else{
        isEnd = true
        return aval
      }
    } else if (val.done) {
      return val.value
    } else if (isGeneratorFunction(ge)) {
      return runYieldSync(ge(),val)
    } else if(isGenerator(ge)) {
      let rval = runYieldSync(val.value)
      if(isEnd){
        return runYieldSync(ge,ge.return(rval))
      }else{
        return runYieldSync(ge,ge.next(rval))
      }
    } else {
      return ge
    }
  }
  return runYieldSync
}


/**
type source
line int
colum int
current int
source string
|
type error
expect string
actual string
line int
colum int
msg string
**/

function createParsecContext(source){
  return {
    type: "source",
    line: 0,
    colum: 0,
    current: 0,
    source: source,
  }
}
function createError(context,expect,actual){
  return {
    type: "error",
    line: context.line,
    colum: context.colum,
    expect: expect,
    actual:actual,
    msg: "expect:" + expect + "  " + "actual:"+actual
  }
}

function parse(parsec,source){
  let runP = withContext(createParsecContext(source))
  return runP(parsec)
}

function anyChar(context) {
  if (context.current == context.source.length) {
    return createError(context,"anyChar","line end of")
  } else {
    let val = context.source.slice(context.current,context.current+1)
    if (val == "\n") {
      return [val,{
        ...context,
        current: context.current + 1,
        line: context.line + 1,
        colum: 0
      }]
    } else {
      return [val,{
        ...context,
        current: context.current + 1,
        colum: context.colum + 1
      }]
    }
  }
}
let char = c => ctx => {
  let anyVal = anyChar(ctx)
  if(anyVal.type === 'error'){
    return createError(ctx,c,anyVal.actual)
  } else {
    let [val,nctx] = anyVal
    if (c == val) {
      return [val,nctx]
    } else {
      return createError(ctx,c,val)
    }
  }
}
let string = str => ctx => {
  let actual = ""
  let actx = ctx
  for(let i=0;i<str.length;i++){
    let anyVal = anyChar(actx)
    if(anyVal.type === 'error'){
      return createError(ctx,str,anyVal.actual)
    } else {
      let [val,nctx] = anyVal
      if(val == str.charAt(i)){
        actual += val
        actx = nctx
      }else{
        return createError(ctx,str,actual+val)
      }
    }
  }
  return [actual,actx]
}
let getContext = ctx => [ctx,ctx] 
let setContext = ctx = _ => [null, ctx]
let many = parser => ctx => {
  let runY = withContext(ctx)
  let rs = []
  let rctx = ctx
  while(true){
    rctx = runY(getContext)
    let a = runY(parser)
    if(a.type === 'error'){
      break
    }else{
      rs.push(a)
    }
  }
  return [rs,rctx]

}
function* many1(parser){
  let rs = many(parser)
  if(rs.length == 0){
    return yield parser
  } else {
    return rs
  }
}
