export const shift = [0.0, 2.0, 4.0];
export const mod = (a, n) => { return ((a % n) + n) % n; };

//
export const calcHue = (rgb) => {
    const gbr = rgb.map((v, i, arr)=> { return arr[mod(i - 2, 3)]; });
    const brg = rgb.map((v, i, arr)=> { return arr[mod(i - 1, 3)]; });
    //let G = C < 1 ? m / (1 - C) : 0;
    return (C > 0 ? Math.max(...rgb.map(function(v, i){
        const a = (gbr[i] - brg[i]) / C, b = mod(a + shift[i], 6.0);
      return b * (M == v);
    })) : 0.0) / 6.0;
}

//
export const calcRgb = (h) => {
    return Array.from([h, h, h]).map(function(v, i){
        const a = mod(v - shift[i], 6.0), b = Math.abs(a - 3.0) - 1.0;
        return Math.min(Math.max(b, 0.0), 1.0);
    });
}

//
export const inv60  = (val)=>{ return val/59.99999999999999; }
export const inv100 = (val)=>{ return val/99.99999999999999; }
export const inv255 = (val)=>{ return val/255.0; }
export const inv360 = (val)=>{ return val/359.99999999999999; }

//
export default {
    inv60, inv100, inv255, inv360,
    RGB: Symbol("RGB"),
    HCG: Symbol("HCG"),
    HSV: Symbol("HSV"),
    HSL: Symbol("HSL"),
    HWB: Symbol("HWB"),
    HCI: Symbol("HCI"),
    HSI: Symbol("HSI"),

    //
    do({ input=this.RGB,output=this.RGB,value=[0,0,0],luma=[1.0/3.0,1.0/3.0,1.0/3.0] }) {
        // let extract components from inputs
        let [H,m,M,C,I,Y,x] = [null,null,null,null,null,null]; // X is reserved variable

        switch(input) {
            case this.RGB:
            H = calcHue(value), m = Math.min.apply(Math, value), M = Math.max.apply(Math, value), C = M - m, I = (value[0]*luma[0]+value[1]*luma[1]+value[2]*luma[2]), Y = I - m;
            break;

            case this.HSV:
            H = value[0], C = value[1] * value[2], M = value[2];
            break;

            case this.HSL:
            H = value[0], C = (1.0-Math.abs(2.0*value[2]-1.0)) * value[1], m = value[2] - C*0.5;
            break;

            case this.HCG:
            H = value[0], C = value[1], m = value[2] * (1 - C);
            break;

            case this.HWB:
            x = value[1] + value[2]; if (x > 1.0) value[1] /= x, value[2] /= x; x = null;
            H = value[0], M = 1.0 - value[2], m = value[1];
            break;

            case this.HCI:
            Y = (2.0-Math.abs(mod(H*6.0,2.0)-1.0))*C/3.0, I = value[2];
            H = value[0], C = value[1], m = I - Y;
            break;

            case this.HSI:
            I = value[2], Y = I * value[1], x = (2.0-Math.abs(mod(H*6.0,2.0)-1.0))/3.0;
            H = value[0], C = Y / x, m = I - Y;
            break;
        }

        if (Y == null) { Y = (2.0-Math.abs(mod(H*6.0,2.0)-1.0))*C/3.0; }
        if (I == null) { I = Y + m; }
        if (M == null) { M = m + C; }
        if (C == null) { C = M - m; }
        if (m == null) { m = M - C; }

        switch(output) {
            case this.RGB:
            return calcRgb(H).map((v)=>{return (v*C+m);});
            
            case this.HSV:
            return [H, M>0.0 ? C/M : 0.0, M];

            case this.HSL:
            x = (m + M) * 0.5;
            return [H, x<1.0 ? C/(1.0-Math.abs(2.0*x-1.0)) : 0.0, x];

            case this.HWB:
            return [H, m, 1.0-M];

            case this.HCG:
            return [H, C, C<1.0 ? m/(1.0-C) : 0.0];

            case this.HCI:
            return [H, C, I];

            case this.HSI:
            return [H, I>0.0 ? 1.0-m/I : 0.0, I];
        }
    }
};
