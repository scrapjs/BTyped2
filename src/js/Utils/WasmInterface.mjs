//
const _strLen = (buffer, ptr) => {
    let count = 0;
    const dv = new DataView(buffer, ptr);
    while (count < dv.byteLength && dv.getUint8(count++)) {}
    return count;
};

//
const _str = (txtdec, buffer, ptr) => {
    return txtdec.decode(new Uint8Array(buffer, ptr, _strLen(buffer, ptr)))
};

//
export const MakeImport = (memory, localStorage = localStorage) => {
    const txtdec = new TextDecoder();
    return {
        Math,
        native: {
            address() {
                return (memory.buffer.address()||0n) + BigInt(memory.byteOffset||0);
            }
        },
        storage: {
            set: (charptr, value) => {
                localStorage.setItem(_str(txtdec, memory.buffer, charptr), value);
            },
            get: (charptr) => {
                localStorage.getItem(_str(txtdec, memory.buffer, charptr));
            },
            remove: (charptr) => {
                localStorage.removeItem(_str(txtdec, memory.buffer, charptr));
            }
        }
    }
};
