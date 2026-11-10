/* QR versión 1-L, modo byte, máscara 0. Credenciales ASCII de hasta 17 bytes. */
window.ecqQR = function (text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  if (bytes.length > 17) throw new Error("Credencial demasiado larga");
  const bits = [];
  const put = (n, l) => {
    for (let i = l - 1; i >= 0; i--) bits.push((n >>> i) & 1);
  };
  put(4, 4);
  put(bytes.length, 8);
  bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, 152 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8)
    data.push(parseInt(bits.slice(i, i + 8).join(""), 2));
  for (let p = 0; data.length < 19; p++) data.push(p % 2 ? 17 : 236);
  const mul = (a, b) => {
    let r = 0;
    while (b) {
      if (b & 1) r ^= a;
      a <<= 1;
      if (a & 256) a ^= 285;
      b >>= 1;
    }
    return r;
  };
  let gen = [1],
    v = 1;
  for (let i = 0; i < 7; i++) {
    const n = Array(gen.length + 1).fill(0);
    gen.forEach((c, j) => {
      n[j] ^= c;
      n[j + 1] ^= mul(c, v);
    });
    gen = n;
    v = mul(v, 2);
  }
  const rem = [...data, ...Array(7).fill(0)];
  for (let i = 0; i < 19; i++) {
    let f = rem[i];
    gen.forEach((c, j) => (rem[i + j] ^= mul(c, f)));
  }
  const all = [...data, ...rem.slice(19)],
    stream = [];
  all.forEach((b) => {
    for (let i = 7; i >= 0; i--) stream.push((b >>> i) & 1);
  });
  const m = Array.from({ length: 21 }, () => Array(21).fill(null));
  const set = (x, y, d) => {
    if (x >= 0 && y >= 0 && x < 21 && y < 21) m[y][x] = d;
  };
  for (const [x, y] of [
    [0, 0],
    [14, 0],
    [0, 14],
  ])
    for (let dy = -1; dy <= 7; dy++)
      for (let dx = -1; dx <= 7; dx++)
        set(
          x + dx,
          y + dy,
          dx >= 0 &&
            dx <= 6 &&
            dy >= 0 &&
            dy <= 6 &&
            (dx === 0 ||
              dx === 6 ||
              dy === 0 ||
              dy === 6 ||
              (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4))
            ? 1
            : 0,
        );
  for (let i = 8; i < 13; i++) {
    set(i, 6, i % 2 === 0 ? 1 : 0);
    set(6, i, i % 2 === 0 ? 1 : 0);
  }
  const fmt = (value) => {
    for (let i = 0; i <= 5; i++) set(8, i, (value >>> i) & 1);
    set(8, 7, (value >>> 6) & 1);
    set(8, 8, (value >>> 7) & 1);
    set(7, 8, (value >>> 8) & 1);
    for (let i = 9; i < 15; i++) set(14 - i, 8, (value >>> i) & 1);
    for (let i = 0; i < 8; i++) set(20 - i, 8, (value >>> i) & 1);
    for (let i = 8; i < 15; i++) set(8, 6 + i, (value >>> i) & 1);
    set(8, 13, 1);
  };
  fmt(0);
  let index = 0,
    up = true;
  for (let x = 20; x >= 1; x -= 2) {
    if (x === 6) x--;
    for (let i = 0; i < 21; i++) {
      let y = up ? 20 - i : i;
      for (let dx = 0; dx < 2; dx++) {
        let xx = x - dx;
        if (m[y][xx] === null)
          m[y][xx] = (stream[index++] || 0) ^ ((xx + y) % 2 === 0 ? 1 : 0);
      }
    }
    up = !up;
  }
  let f = 8 << 10;
  for (let i = 14; i >= 10; i--) if ((f >>> i) & 1) f ^= 0x537 << (i - 10);
  fmt(((8 << 10) | f) ^ 0x5412);
  let path = "";
  m.forEach((r, y) =>
    r.forEach((v, x) => {
      if (v) path += `M${x + 4} ${y + 4}h1v1h-1z`;
    }),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" width="290" height="290" role="img" aria-label="Código QR de la credencial"><rect width="29" height="29" fill="white"/><path d="${path}" fill="black"/></svg>`;
};
