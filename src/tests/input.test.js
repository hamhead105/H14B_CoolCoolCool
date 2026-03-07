//sum.test.js
const add=require('../input.js')
test('first test',()=>{
    expect(add(2,3)).not.toBe(3)
})