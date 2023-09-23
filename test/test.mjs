import * as B from "../src/index.mjs";

//
const Test = B.StructWrap(new B.StructLayout("Test", [
    ["field0", "uint8"],
    ["field1", "uint8[2]"]
], 4)).$auto;

//
const AB = new ArrayBuffer(256);

//
const I = (new Test({
    field0: 1,
    field1: [2, 3]
}));

//I.field0 = 1;
//I.field1 = [2, 3];

console.log(I);
console.log(I.field0);
console.log(I.field1);
console.log(I.field1[0], I.field1[1]);
console.log(I["field1:uint16"]); // type-cast getter
console.log(I.field1);

// type casted assign
I[0] = { "field0:uint16": 0xffff };
console.log(I.field0);
console.log(I.field1[0], I.field1[1]);
