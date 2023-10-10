import * as B from "../src/js/index.mjs";

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

//
const U8 = B.StructWrap("uint8");
const U32 = B.StructWrap("uint32");
const $field0 = new U8([0, 1, 2, 3]);
const $field1 = new U32([4, 5, 6, 7]);

console.log($field0, $field1);

//
const SOA = B.Group({
    field0: $field0,
    field1: $field1
});

//
const AOS = B.Tuple({
    field0: $field0,
    field1: $field1
});

//
console.log(SOA[0].field0);
console.log(SOA[0].field1);
console.log(AOS.field0[0]);
console.log(AOS.field1[0]);
