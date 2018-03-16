let fs = require('fs')
let code = fs.readFileSync('src/parsec.js','utf-8')
let testCode = fs.readFileSync('test/parsec.js','utf-8')
eval(`
  ${code}
  ${testCode}
  test()
  `)
