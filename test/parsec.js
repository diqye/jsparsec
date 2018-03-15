function parsecTest() {
  let r1 = parse(char('h'),'hello')
  console.assert(r1 == 'h')
  let r11 = parse(char('l'),'hello')
  console.assert(r11.type == 'error')
  function* char2(){
    let h = yield char('h')
    yield anyChar
    let l = yield char('l')
    return h + l
  }
  let r2 = parse(char2,'hello')
  console.assert(r2 == 'hl')
  let r3 = parse(string("hello"),"hello")
  console.assert(r3 == "hello")
  let r4 = parse(string("hello"),"hell0")
  console.assert(r4.actual == "hell0")
  let r5 = parse(many(string("hi")),"hihihi000")
  console.assert(r5.join(',') == "hi,hi,hi")
  let r6 = parse(function*(){
    let hi = yield many(string("hi"))
    let z = yield many(char('0'))
    return hi.join('')+z.join('')
  },"hihihi000")
  console.assert(r6 == "hihihi000")
}
function logt(msg){
  console.log("%c" + msg,"color:#999")
}
function logOk(msg){
  console.log("%c"+msg,"color:red")
}
function test() {
  let runYieldSync = withContext({name:"test",age:10})
  logt("Basic testing is being carried out")
  console.assert(runYieldSync("hello") == "hello")

  function* yge() {
    return "yge"
  }
  console.assert(runYieldSync(yge) == "yge")
  console.assert(runYieldSync(yge()) == "yge")
  function* yge2() {
    let a = yield yge
    let b = yield yge()
    return a + " " + b
  }
  console.assert(runYieldSync(yge2) == "yge yge")
  function cusum (ctx) {
    return [ctx.name,{name:"diqye"}]
  }
  console.assert(runYieldSync(cusum) == "test")
  function* cusum2 () {
    let a = yield cusum
    let b = yield function* () { return yield cusum }
    return a + b
  }
  console.assert(runYieldSync(cusum2) == "diqyediqye")

  function error(ctx){
    return "I am a error"
  }
  function* errorTest() {
    let a = yield error
    throw "我不会被执行"
    return "hello"
  }
  let runY1 = withContext("hello")
  console.assert(runY1(error) == "I am a error")
  let runY = withContext("hello")
  console.assert(runY(errorTest) == "I am a error")
  logt("Parsec begin")
  let r1 = parse(anyChar,"hello")
  console.assert(r1 == "h")
  let r2 = parse(anyChar,"")
  console.assert(r2.type == "error")
  function* char3 () {
    let a = yield anyChar
    let b = yield anyChar
    let c = yield anyChar
    return a + b + c
  }
  let r3 = parse(char3,"123")
  console.assert(r3 == "123")
  parsecTest()
  logOk("All the tests were successful")
}
