/*
 * 暂不做模块化 
 */
// a -> Bool
function isGeneratorFunction(a){return Object.prototype.toString.call(a) == "[object GeneratorFunction]"}
// a -> Bool
function isGenerator(a){return Object.prototype.toString.call(a) == "[object Generator]"}
// a -> Bool
function isFunction(a){return Object.prototype.toString.call(a) == "[object Function]"}
// a -> Bool
function isArray(a){return Array.isArray(a)}

// Parsec a = ctx -> (a,ctx)
// ctx -> Generator a -> a
// ctx -> Parsec a -> a
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

// (Parsec a,String) -> a
function parse(parsec,source){
  let runP = withContext(createParsecContext(source))
  return runP(parsec)
}

// Parsec a
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
// Char -> Parsec Char
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
// String -> Parsec String
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

// Parsec ctx
let getContext = ctx => [ctx,ctx] 
// ctx -> Parsec ctx
let setContext = ctx = _ => [null, ctx]
// Parsec a -> [Parsec a]
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
// Parsec a -> [Parsec a]
function* many1(parser){
  let rs = yield many(parser)
  if(rs.length == 0){
    return yield parser
  } else {
    return rs
  }
}
// [Parsec a] -> Parsec a
let anys = ps => ctx => {
  // todo 暂不做预期的提示
  if(ps.length == 0){
    return createError(ctx,'<anys todo>','<todo>')
  } else {
    let [p,...restp] = ps
    let runY = withContext(ctx)
    let pr = runY(p)
    if(pr.type === 'error'){
      return anys(restp)(ctx)
    }else{
      return [pr,runY(getContext)]
    }
  }
}

// Parsec ()
let space = anys([char(' '),char('\n'),char('\r'),char('\t')])
// Parsec ()
let spaces = many(space)

// Parsec a -> Paesec a
let lookAhead = p => ctx => {
  let runY = withContext(ctx)
  let pr = runY(p)
  if(pr.type === 'error'){
    return pr
  }else{
    return [pr,ctx]
  }
}

// Parsec a -> Parsec b -> [Parsec a]
let manyTill = (p,p2) => endp => ctx =>{
  if(p2){
    throw '正确的使用方式: manyTill(p1)(p2) 请不要使用 manyTill(p1,p2)'
  }else{
    void null
  }
  let nctx = ctx
  let runY = withContext(ctx)
  let r = []
  while(true){
    let epr = runY(endp)
    if(epr.type === 'error'){
      runY = withContext(nctx)
      let pr = runY(p)
      if(pr.type === 'error'){
        return pr
      }else{
        nctx = runY(getContext)
        r.push(pr)
      }
    }else{
      break
    }
  }
  return [r,nctx]
}

// Parsec a -> Parsec ()
let notFollowedBy = p => ctx => {
  let runY = withContext(ctx)
  let pr = runY(p)
  if(pr.type === 'error'){
    return [null,ctx]
  }else{
    return createError(ctx,'notFollowedBy','pass')
  }
}

// Parsec ()
let eof = notFollowedBy(anyChar)

// Parsec p -> Parsec sep -> Parsec [p]
let stepBy1 = p => sep => function* () {
  let x = yield p
  let xs = yield many(function* (){
    yield sep
    return yield p
  })
  return [x].concat(xs)
}
// a -> Parsec a
let final = a => ctx => [a,ctx]
// Parsec p -> Parsec sep -> Parsec [p]
let stepBy = p => sep => anys([stepBy1(p)(sep),final([])])
