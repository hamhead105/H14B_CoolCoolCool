//sum.test.js
const input=require('../input.js');
const fs = require('fs');

const inputPath = 'src/tests/test_inputs/creation_input_1.json';
const actualPath = 'src/creation_output.xml';
const expectedPath = 'src/tests/expected_outputs/creation_expected_1.xml';

test('test create_xml matches expected',()=>{
    const creation_input = fs.readFileSync(inputPath, 'utf-8');
    const actualContent = fs.readFileSync(actualPath, 'utf-8');
    const expectedContent = fs.readFileSync(expectedPath, 'utf-8');

    input(creation_input);
    expect(actualContent).toEqual(expectedContent);
})