# JS Parsec  先占个位置, 完成度(80%)

解析CSS的例子
```javascript
function* propparser(){
  let key = yield manyTill(anyChar,':')
  let val = yield manyTill(anyChar,';')
  yield spaces
  return [key,val]
}
function toObject(ps){
  let propObj = {}
  ps.forEach(([key,val])=>{
    propObj[key] = val
  })
  return propObj
}
function* cssparsec(){
  yield spaces
  let title = yield manyTill(anyChar,'{')
  yield spaces
  let props = yield stepBy(proppaser,oneOf('\n\r'))
  yield spaces
  yield char('}')
  return {
    tite: title,
    props:toObject(props)
  }
}

parse(many1(cssparser),`
.hello {
  width: 100px;
  height: 100px;
}
`) -> [{title:'.hello',props:{width:"100px",height:"100px"}}]
```
