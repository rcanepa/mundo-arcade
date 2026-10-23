// ===== Dibujo de los autos: de lado (garaje, diario, drive-in), de atrás y de frente (carreras) =====
// Cada modelo se describe mirando a la derecha, con x de 0 (cola) a 100 (trompa) e y hacia arriba (0 = suelo).
// [x, y, 1] marca una esquina; el resto de los puntos se une con curvas suaves.
const ART = {
  chevy49: { len: 5.0, wr: 7.1, wheels: [80, 22], belt: 23,
    body: [[2.5, 8, 1], [1.2, 13], [2, 18.5], [6, 21.6], [16, 22.6], [30, 22.7], [48, 23], [66, 23.2], [80, 22.6], [91, 21.2], [97.2, 18.2], [99.3, 13], [99, 8.6], [97.5, 6.4, 1], [60, 5.8, 1], [10, 6.2, 1]],
    cabin: [[67, 23, 1], [61, 31], [56, 32.7], [43, 32.9], [36, 31.4], [29.5, 22.6, 1]],
    glass: [[[64, 23.8, 1], [59.8, 30.4], [56, 31.6], [50.4, 31.8], [50.4, 23.8, 1]], [[48.6, 23.8, 1], [48.6, 31.8], [44, 31.8], [38, 30.7], [33.5, 23.8, 1]]],
    trims: [[[96, 15.4], [70, 15.4]]], doors: [[[66, 6.2], [66.5, 22.6]], [[49.4, 6], [49.6, 23]]], handle: [51.5, 18.5],
    head: [97.8, 16.6, 2.2], tail: [[1.4, 13.8], [2.6, 13.8], [2.8, 17], [1.7, 17]],
    bumpF: [[96.5, 6], [101, 6.3], [101.4, 10.6], [97, 10.9]], bumpR: [[-0.8, 6.6], [3.6, 6.6], [3.6, 10.4], [-0.5, 10.4]],
    rear: { lights: 'vert', fin: 0, roundness: 0.8, roofW: 0.66, deck: 0.47 } },
  falcon60: { len: 4.6, wr: 6.6, wheels: [80, 20], belt: 19.3,
    body: [[2, 8, 1], [0.8, 12.5], [1.2, 17.5], [2.2, 19, 1], [18, 19.2], [31, 19.2], [50, 19.3], [65.6, 19.4], [80, 19.3], [93, 18.6], [98, 17.2], [99.4, 13.5], [99, 8.5], [97.5, 6.3, 1], [60, 5.4, 1], [8, 6, 1]],
    cabin: [[66, 19.3, 1], [59.5, 27.6], [55, 28.6], [41, 28.6], [36.5, 27.6], [30, 19.3, 1]],
    glass: [[[63.4, 20.1, 1], [58.6, 26.9], [55, 27.8], [49.8, 27.8], [49.8, 20.1, 1]], [[48.2, 20.1, 1], [48.2, 27.8], [42, 27.8], [38.4, 26.9], [33.4, 20.1, 1]]],
    trims: [[[96, 15], [4, 15]]], doors: [[[65.5, 6], [65.8, 19.3]], [[49, 5.8], [49, 19.3]]], handle: [51, 17],
    head: [98.5, 15.2, 2.0], tail: [[0.6, 13.2], [2, 13.2], [2, 16], [0.6, 16]],
    bumpF: [[97, 6], [100.8, 6.3], [100.9, 9.6], [97, 9.8]], bumpR: [[-0.8, 6.4], [3, 6.4], [3, 9.8], [-0.8, 9.8]],
    rear: { lights: 'round1', fin: 0, roundness: 0.4, roofW: 0.72, deck: 0.5 } },
  valiant61: { len: 4.7, wr: 6.7, wheels: [79, 21.5], belt: 19,
    body: [[2, 8, 1], [0.8, 12], [1.5, 17.5], [3, 20.2, 1], [12, 19.4], [33, 18.8], [50, 18.9], [62.5, 19], [78, 19], [92, 18.6], [97.5, 17], [99.4, 13], [99, 8.5], [97.5, 6.3, 1], [60, 5.4, 1], [8, 6, 1]],
    cabin: [[63, 19, 1], [57.5, 27], [53, 27.8], [41, 27.8], [37.5, 27], [31.5, 18.8, 1]],
    glass: [[[60.5, 19.8, 1], [56.6, 26.3], [53, 27], [48.4, 27], [48.4, 19.8, 1]], [[46.8, 19.8, 1], [46.8, 27], [42, 27], [39, 26.3], [34.4, 19.8, 1]]],
    trims: [[[97, 15], [40, 15], [5, 17.2]]], doors: [[[62.6, 6], [62.8, 19]], [[47.6, 5.8], [47.6, 19]]], handle: [49.6, 16.6],
    head: [98.4, 15.5, 1.9], tail: [[0.8, 14.6], [2.2, 14.6], [2.4, 18.4], [1, 18.4]],
    bumpF: [[97, 6], [100.8, 6.3], [100.9, 9.6], [97, 9.8]], bumpR: [[-0.8, 6.4], [3, 6.4], [3, 9.8], [-0.8, 9.8]],
    rear: { lights: 'cat', fin: 0.35, roundness: 0.3, roofW: 0.7, deck: 0.5 } },
  ford32: { len: 4.2, wr: 7.4, wrRear: 8.6, wheels: [82, 18], belt: 24, highboy: 1,
    body: [[3.5, 11, 1], [3, 17], [4.2, 21.5], [9, 23.6], [20, 24.1], [36, 24.1, 1], [45, 24.6, 1], [62, 25], [84.6, 25.2, 1], [86.6, 12, 1], [80, 11.4, 1], [40, 11, 1]],
    seat: [[25, 24, 1], [26, 29], [29, 30.2], [35, 29.6], [36.2, 24.1, 1]],
    shield: [[45.2, 24.6], [42.6, 36.2], [40.6, 36.2], [43.2, 24.6]],
    grille: [[84.4, 25.4, 1], [87, 12, 1], [85.6, 11.8, 1], [83.2, 25.2, 1]],
    lamp: [89.2, 22.6, 2.5], frame: [[8, 10.2], [90, 10.6]], hood: [62, 84.4], pipes: 1,
    trims: [], doors: [[[44, 11.4], [44.6, 24.4]], [[62, 11.2], [62, 25]]], handle: [46, 21],
    tail: [[2.4, 13], [3.8, 13], [3.8, 15.2], [2.4, 15.2]],
    bumpF: [[88, 8], [91, 8], [91, 10], [88, 10]], bumpR: [[0, 9.2], [4, 9.2], [4, 11], [0, 11]],
    rear: { lights: 'round2', fin: 0, roundness: 0.7, roofW: 0, deck: 0.62, open: 1 } },
  ford40: { len: 4.8, wr: 7.5, wheels: [81, 22], belt: 24.5,
    body: [[2.5, 10.6, 1], [2.2, 14], [5, 19], [12, 23], [24, 26.6], [34, 31.6], [42, 33.8], [53, 34], [58, 32.8], [63, 24.6], [75, 24.2], [88, 23.6], [93.5, 22], [96.6, 18.5], [97.6, 13], [96.6, 10.6, 1], [80, 10.8, 1], [20, 10.8, 1]],
    glass: [[[60.4, 25.4, 1], [56.6, 31.6], [52.6, 32.5], [44.4, 32.4], [44.4, 25.4, 1]], [[42.8, 25.4, 1], [42.8, 32.2], [37.6, 30.8], [33.4, 25.4, 1]]],
    fenders: [
      [[62.5, 10.4, 1], [66, 16], [73, 21], [81, 22.7], [89, 21.6], [95, 17.6], [98, 12], [98.2, 9.2, 1], [64, 9.2, 1]],
      [[8, 9.2, 1], [9, 14], [14, 18.7], [22, 20.2], [30, 18.6], [35, 14], [36.5, 9.2, 1]]],
    board: [[35.5, 9.8], [64.5, 9.8], [64.5, 8.2], [35.5, 8.2]],
    grille: [[96.6, 18.5], [97.6, 13], [96.6, 10.8], [95.6, 10.8], [95.8, 18.5]],
    trims: [[[95, 22.4], [64, 24]]], doors: [[[61.4, 11], [62.2, 24.4]], [[44, 11], [44, 24.6]]], handle: [46, 21.4],
    head: [91.4, 18.6, 1.7], tail: [[20.6, 17.6], [23.4, 17.6], [23.4, 19.4], [20.6, 19.4]],
    bumpF: [[96, 7.4], [101.6, 7.4], [101.6, 9.8], [96, 9.8]], bumpR: [[-1.6, 7.4], [4, 7.4], [4, 9.8], [-1.6, 9.8]],
    rear: { lights: 'round2', fin: 0, roundness: 1, roofW: 0.6, deck: 0.42, fenders: 1 } },
  merc49: { len: 5.18, wr: 7.0, wheels: [79, 21], belt: 22.6, skirts: 1,
    body: [[2, 9, 1], [0.8, 13.5], [2, 19], [7, 22], [18, 22.8], [31, 22.7], [48, 22.8], [65.5, 22.9], [80, 22.6], [91, 21.3], [97, 18.6], [99.3, 14], [99.2, 9], [97.5, 6.5, 1], [60, 5.5, 1], [8, 6.2, 1]],
    cabin: [[66, 22.8, 1], [60, 30], [55, 31.2], [44, 31.3], [37, 29.8], [29, 22.6, 1]],
    glass: [[[63.5, 23.6, 1], [58.8, 29.3], [55, 30.2], [45, 30.3], [40, 29.2], [35.5, 23.6, 1]]],
    trims: [[[95, 12], [6, 12]]], doors: [[[65.6, 6], [66, 22.8]], [[45.6, 5.8], [45.8, 22.8]]], handle: [47.6, 18.6],
    head: [98, 16.2, 2.2], tail: [[0.8, 13.4], [2.2, 13.4], [2.6, 17.2], [1.3, 17.2]],
    bumpF: [[96.5, 6], [101, 6.3], [101.4, 10.6], [97, 10.9]], bumpR: [[-0.8, 6.6], [3.6, 6.6], [3.6, 10.4], [-0.5, 10.4]],
    rear: { lights: 'vert', fin: 0, roundness: 0.9, roofW: 0.62, deck: 0.46 } },
  olds50: { len: 5.1, wr: 7.1, wheels: [80, 21], belt: 22.6,
    body: [[2, 8.5, 1], [0.8, 13], [1.8, 18], [6, 21], [17, 22], [30, 22.2], [48, 22.4], [66.5, 22.6], [80, 22.4], [92, 21], [97.5, 18], [99.4, 13], [99, 8.5], [97.5, 6.4, 1], [60, 5.5, 1], [8, 6.3, 1]],
    cabin: [[67, 22.6, 1], [61, 30.5], [55, 31.8], [44, 31.6], [36, 28.6], [25, 22.4, 1]],
    glass: [[[64.5, 23.4, 1], [60, 29.8], [55, 30.8], [50, 30.8], [50, 23.4, 1]], [[48.4, 23.4, 1], [48.4, 30.7], [44.6, 30.6], [39.6, 28.4], [34, 23.4, 1]]],
    trims: [[[96, 15.5], [58, 15.5]], [[30, 8], [15, 8]]], doors: [[[66.2, 6], [66.6, 22.6]], [[49.2, 5.8], [49.2, 22.6]]], handle: [51.2, 18.6],
    head: [98, 16.5, 2.2], tail: [[1, 14], [2.2, 14], [2.4, 17], [1.3, 17]],
    bumpF: [[96.5, 6], [101, 6.3], [101.4, 10.6], [97, 10.9]], bumpR: [[-0.8, 6.6], [3.6, 6.6], [3.6, 10.4], [-0.5, 10.4]],
    rear: { lights: 'vert', fin: 0, roundness: 0.85, roofW: 0.6, deck: 0.45 } },
  chevy55: { len: 4.95, wr: 7.0, wheels: [79, 22], belt: 20.4,
    body: [[2, 7.5, 1], [1.2, 12.5], [1.6, 18.6], [3, 20.6, 1], [18, 20.4], [32, 20.3], [50, 20.5], [67, 20.8], [80, 20.8], [93, 20.3], [97.8, 19], [99.3, 14.5], [99, 9], [97.5, 6.4, 1], [60, 5.4, 1], [8, 5.8, 1]],
    cabin: [[67.6, 20.8, 1], [60.2, 29], [56, 29.8], [43, 29.8], [38, 29], [31.5, 20.4, 1]],
    glass: [[[64.8, 21.6, 1], [59.5, 28.2], [56, 28.9], [51.2, 28.9], [51.2, 21.6, 1]], [[49.6, 21.6, 1], [49.6, 28.9], [44, 28.9], [39.4, 28.2], [34.8, 21.6, 1]]],
    trims: [[[96, 16.2], [52, 16.2]], [[30, 17.4], [4, 17.4]]], doors: [[[67, 6], [67.4, 20.8]], [[50.4, 5.6], [50.4, 20.6]]], handle: [52.4, 18],
    head: [98.6, 17.2, 1.9], tail: [[0.8, 14.4], [2, 14.4], [2.2, 18.4], [1, 18.4]],
    bumpF: [[96.5, 5.8], [101, 6], [101.2, 10.2], [97, 10.4]], bumpR: [[-0.8, 6.2], [3.4, 6.2], [3.4, 9.8], [-0.6, 9.8]],
    rear: { lights: 'vert', fin: 0.15, roundness: 0.35, roofW: 0.68, deck: 0.5 } },
  chevy57: { len: 5.0, wr: 7.0, wheels: [79, 22], belt: 20.4,
    body: [[2, 7, 1], [1.2, 12.5], [1.6, 18.5], [2.2, 21.4, 1], [14, 20.9], [33, 20.3], [50, 20.4], [66, 20.6], [80, 20.2], [93, 19.6], [97.6, 18.2], [99.3, 14], [99, 9], [97.5, 6.2, 1], [60, 5.2, 1], [10, 5.6, 1]],
    cabin: [[67.5, 20.6, 1], [59, 28.6], [55, 29.5], [44, 29.5], [38, 28.6], [31, 20.4, 1]],
    glass: [[[64.5, 21.3, 1], [58.2, 27.8], [55, 28.5], [44, 28.5], [39.5, 27.8], [35, 21.3, 1]]],
    vent: [[60.6, 21.3], [58.6, 27.4]],
    wedge: [[52, 14.6], [3, 18], [3, 11.6]],
    trims: [[[96, 15.4], [52, 14.6]], [[52, 14.6], [3, 18]], [[52, 14.6], [3, 11.6]]], doors: [[[66.4, 5.6], [66.8, 20.6]], [[49, 5.4], [49, 20.4]]], handle: [51, 17.8],
    head: [98.3, 16.6, 1.8], tail: [[0.9, 16.6], [2.2, 16.6], [2.4, 19.4], [1.2, 19.4]], ornaments: [[87, 19.9], [80, 20.2]],
    bumpF: [[96, 5.4], [101, 6], [101.2, 10.6], [97, 11]], bumpR: [[-0.6, 6.4], [3.4, 6.4], [3.4, 10], [-0.4, 10.2]],
    rear: { lights: 'fin', fin: 0.45, roundness: 0.3, roofW: 0.66, deck: 0.5 } },
  tbird57: { len: 4.7, wr: 6.9, wheels: [79, 24], belt: 19,
    body: [[2, 8, 1], [0.8, 12.5], [1.5, 17.8], [2.8, 19.6, 1], [15, 19.2], [30, 18.8], [45, 18.9], [60.5, 19], [78, 18.8], [93, 18.2], [97.5, 16.5], [99.3, 13], [99, 8.5], [97.5, 6.4, 1], [60, 5.2, 1], [8, 5.8, 1]],
    cabin: [[61, 19, 1], [55.5, 26.2], [51, 27], [38, 27], [33, 25.6], [29, 19, 1]],
    glass: [[[58.5, 19.8, 1], [54.4, 25.4], [51, 26.1], [45, 26.1], [45, 19.8, 1]]], port: [39, 23, 1.9],
    scoop: [[75, 18.7], [79, 19.9], [88.5, 19.8], [91, 18.5]],
    trims: [[[96, 14], [45, 14], [25, 15.4], [3, 15.4]]], doors: [[[60.6, 5.6], [60.8, 19]], [[44.6, 5.4], [44.6, 19]]], handle: [46.6, 16.4],
    head: [98.2, 15.8, 1.9], tail: [[0.6, 14.2], [2, 14.2], [2, 16.8], [0.6, 16.8]],
    bumpF: [[96, 5.6], [100.8, 6], [101, 10], [97, 10.4]], bumpR: [[-0.8, 6.2], [3.2, 6.2], [3.2, 9.6], [-0.6, 9.6]],
    rear: { lights: 'round1', fin: 0.35, roundness: 0.4, roofW: 0.6, deck: 0.55 } },
  fury58: { len: 5.25, wr: 6.9, wheels: [78, 21.5], belt: 19.8,
    body: [[2, 8, 1], [0.8, 13], [1.2, 19.5], [2.5, 24.8, 1], [12, 23.6], [25, 21.5], [34, 19.8], [50, 19.6], [64, 19.6], [80, 19.6], [93, 19], [97.8, 17.5], [99.3, 13.5], [99, 8.5], [97.5, 6.2, 1], [60, 5, 1], [8, 5.8, 1]],
    cabin: [[64.6, 19.6, 1], [57, 26.6], [53, 27.4], [42, 27.4], [37.5, 26.5], [31, 20.2, 1]],
    glass: [[[62, 20.4, 1], [56.5, 26], [53, 26.6], [43, 26.6], [39, 25.9], [34.5, 20.6, 1]]],
    gold: [[97, 15.6], [40, 15.4], [4, 17.6], [4, 12.4], [40, 15.4]],
    trims: [[[97, 15.6], [40, 15.4], [4, 17.6]], [[40, 15.4], [4, 12.4]]], doors: [[[63.8, 5.4], [64.2, 19.6]], [[46, 5.2], [46, 19.6]]], handle: [48, 17.4],
    head: [98.4, 16.2, 1.7], tail: [[0.7, 17], [2, 17], [2.4, 22], [1.1, 22]],
    bumpF: [[96, 5.4], [101, 5.8], [101.2, 10.2], [97, 10.6]], bumpR: [[-0.8, 6.2], [3.4, 6.2], [3.4, 10], [-0.6, 10]],
    rear: { lights: 'fin', fin: 1, roundness: 0.3, roofW: 0.66, deck: 0.48 } },
  corvette58: { len: 4.5, wr: 6.9, wheels: [80, 22.5], belt: 19.6, open: 1,
    body: [[2, 8, 1], [0.8, 12.5], [2.5, 17.5], [8, 19.8], [20, 20.3], [34, 19.8], [42, 19.6, 1], [44, 18.8, 1], [58, 18.8, 1], [61, 19.8, 1], [78, 19.6], [90, 18.5], [96.5, 16.2], [99.3, 12.5], [99.2, 8.5], [97.5, 6.3, 1], [60, 5.2, 1], [8, 5.8, 1]],
    seat: [[38.4, 19.4, 1], [38.8, 24], [42, 24.8], [45, 24.2], [45.4, 19, 1]],
    shield: [[62, 19.8], [58.8, 27.6], [56.8, 27.6], [59.8, 19.8]], wheelRing: [53.5, 21.6],
    cove: [[71, 14], [66, 16.4], [52, 16.2], [49, 14.6], [49.5, 9.6], [53, 8.8], [66, 9.2], [70.5, 11.5]],
    trims: [[[30, 14], [4, 14]]], doors: [[[58, 6], [58, 18.8]], [[44, 6], [44, 18.8]]], handle: [46, 17],
    head: [98.4, 15, 1.7], tail: [[0.4, 13.4], [1.8, 13.4], [1.8, 15.6], [0.4, 15.6]], louvers: [80, 90, 19.2],
    bumpF: [[96.6, 6], [100.8, 6.4], [101, 9.8], [97, 10]], bumpR: [[-0.8, 6.6], [3, 6.6], [3, 9.6], [-0.6, 9.6]],
    rear: { lights: 'round1', fin: 0, roundness: 0.8, roofW: 0, deck: 0.6, open: 1 } },
  impala61: { len: 5.3, wr: 6.9, wheels: [78, 21], belt: 18.7,
    body: [[1.5, 8, 1], [0.6, 12.5], [1, 17], [2, 18.5, 1], [20, 18.6], [34, 18.6], [50, 18.7], [64, 18.8], [80, 18.8], [94, 18.4], [98.4, 17], [99.5, 13], [99.3, 8.5], [97.8, 6.2, 1], [60, 5.2, 1], [8, 5.8, 1]],
    cabin: [[64.8, 18.8, 1], [57.5, 26], [53, 26.9], [42, 26.9], [37.4, 25.8], [31.8, 18.7, 1]],
    glass: [[[62.2, 19.6, 1], [57, 25.3], [53, 26], [43, 26], [39, 25.2], [34.6, 19.6, 1]]],
    trims: [[[97.5, 15.2], [2, 15.2]], [[97.5, 10.4], [2, 10.4]]], doors: [[[64.2, 5.4], [64.6, 18.8]], [[46.6, 5.2], [46.6, 18.7]]], handle: [48.6, 16.8],
    head: [98.8, 15.5, 1.6], tail: [[0.4, 12.6], [1.6, 12.6], [1.6, 14.6], [0.4, 14.6]], badge: [8, 12.4],
    bumpF: [[96.5, 5.6], [101, 6], [101.2, 10], [97, 10.2]], bumpR: [[-0.8, 6.2], [3.2, 6.2], [3.2, 9.6], [-0.6, 9.6]],
    rear: { lights: 'tri', fin: 0.1, roundness: 0.2, roofW: 0.66, deck: 0.52 } },
  galaxie62: { len: 5.33, wr: 6.9, wheels: [78, 21], belt: 18.9,
    body: [[1.5, 8.5, 1], [0.6, 12.5], [1, 17.4], [2, 18.9, 1], [20, 18.9], [33, 18.8], [50, 18.9], [63.5, 19], [80, 19], [94, 18.6], [98.2, 17], [99.5, 13], [99.3, 8.5], [97.8, 6.2, 1], [60, 5.2, 1], [8, 5.8, 1]],
    cabin: [[64, 19, 1], [57.5, 26.4], [53, 27.3], [38, 27.3], [32.5, 26.4], [27.5, 19, 1]],
    glass: [[[61.5, 19.8, 1], [57, 25.7], [53, 26.4], [42, 26.4], [40.4, 19.8, 1]]],
    trims: [[[98, 14.6], [22, 14.6], [2, 15.6]]], doors: [[[63.6, 5.4], [64, 19]], [[42, 5.2], [42, 19]]], handle: [44, 16.8],
    head: [98.8, 15.6, 1.6], tail: [[0.3, 12.6], [1.4, 12.6], [1.4, 16.4], [0.3, 16.4]],
    bumpF: [[96.5, 5.6], [101, 6], [101.2, 10], [97, 10.2]], bumpR: [[-0.8, 6.2], [3.2, 6.2], [3.2, 9.6], [-0.6, 9.6]],
    rear: { lights: 'round2', fin: 0.1, roundness: 0.2, roofW: 0.64, deck: 0.52 } },
  dart62: { len: 5.1, wr: 6.9, wheels: [78, 21.5], belt: 18.5,
    body: [[1.5, 8, 1], [0.6, 12], [1, 16.8], [2.2, 18.6, 1], [16, 18.6], [33, 18.2], [50, 18.4], [63.5, 18.5], [80, 18.6], [93, 17.9], [98, 16.2], [99.5, 12.5], [99.2, 8.2], [97.8, 6.2, 1], [60, 5.2, 1], [8, 5.8, 1]],
    cabin: [[64, 18.6, 1], [57.8, 25.8], [53, 26.6], [42, 26.6], [37, 25.6], [31.6, 18.3, 1]],
    glass: [[[61.4, 19.4, 1], [56.8, 25.1], [53, 25.8], [44.6, 25.8], [44.6, 19.4, 1]], [[43, 19.4, 1], [43, 25.8], [38.5, 25.1], [34.6, 19.4, 1]]],
    trims: [[[97, 14], [50, 13.2], [4, 15.5]]], doors: [[[63.4, 5.4], [63.8, 18.6]], [[43.8, 5.2], [43.8, 18.4]]], handle: [45.8, 16.4],
    head: [98.6, 14.6, 1.8], tail: [[0.4, 12.4], [1.6, 12.4], [1.8, 16.6], [0.6, 16.6]],
    bumpF: [[96.5, 5.6], [101, 6], [101.2, 10], [97, 10.2]], bumpR: [[-0.8, 6.2], [3.2, 6.2], [3.2, 9.6], [-0.6, 9.6]],
    rear: { lights: 'bar', fin: 0.2, roundness: 0.25, roofW: 0.66, deck: 0.5 } },
  vette63: { len: 4.45, wr: 6.9, wheels: [79, 23], belt: 18.6,
    body: [[1.5, 8, 1], [0.4, 11.5], [1.2, 15.6], [3.5, 17.2, 1], [14, 18.6], [23, 19.4], [31, 18.9], [40, 18.3], [50, 18.4], [60, 18.6], [68, 18.4], [78, 18.2], [88, 16.8], [95, 14.6], [99.6, 12.4, 1], [99.2, 9.6], [97.6, 7.2, 1], [60, 5.2, 1], [8, 6, 1]],
    cabin: [[61, 18.6, 1], [54, 25], [48.5, 25.8], [41, 25], [29, 21.2], [17, 18.8, 1]],
    glass: [[[58.6, 19.4, 1], [53.4, 24.2], [48.6, 24.9], [44.8, 24.5], [43.2, 19.4, 1]], [[41.6, 19.4, 1], [41.8, 24], [36, 22.6], [33, 19.4, 1]]],
    vents: [[69, 9.6], [71, 9.6], [73, 9.6]],
    trims: [[[99.4, 12.4], [60, 13.8], [4, 14.6]]], doors: [[[59.6, 6], [60, 19]], [[42.2, 5.8], [42.2, 18.8]]], handle: [44.2, 17],
    tail: [[0.2, 11.8], [1.4, 11.8], [1.4, 13.8], [0.2, 13.8]],
    bumpF: [[96.6, 6.6], [100.8, 6.8], [100.8, 8.6], [97, 8.8]], bumpR: [[-0.6, 7], [3, 7], [3, 9], [-0.4, 9]],
    rear: { lights: 'round2', fin: 0, roundness: 0.75, roofW: 0.56, deck: 0.5, fast: 1 } }
};

// ----- Materiales -----
function chromeGrad(g, y0, y1) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, '#fbfdff'); gr.addColorStop(0.35, '#c4ccd4'); gr.addColorStop(0.5, '#59626b');
  gr.addColorStop(0.62, '#e9eef3'); gr.addColorStop(1, '#7d8790');
  return gr;
}
function goldGrad(g, y0, y1) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, '#fff3c4'); gr.addColorStop(0.45, '#c9962e'); gr.addColorStop(0.55, '#7a5514'); gr.addColorStop(1, '#e8c060');
  return gr;
}
function polyPath(g, pts, smoothIt = false, tension = 0.5) {
  g.beginPath();
  if (smoothIt) { splinePath(g, pts, true, tension); return; }
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
}
// Pintura: color base, luz de arriba, reflejo del horizonte y sombra abajo (en coordenadas del modelo, y hacia arriba)
function paintBody(g, color, top, bottom, gloss = 1) {
  g.fillStyle = css(color); g.fill();
  const gr = g.createLinearGradient(0, top, 0, bottom);
  const dark = luma(color) < 0.2;
  gr.addColorStop(0, `rgba(255,255,255,${(dark ? 0.32 : 0.42) * gloss})`);
  gr.addColorStop(0.16, `rgba(255,255,255,${0.1 * gloss})`);
  gr.addColorStop(0.42, 'rgba(255,255,255,0)');
  gr.addColorStop(0.47, `rgba(255,255,255,${0.16 * gloss})`);
  gr.addColorStop(0.5, 'rgba(0,0,0,0.12)');
  gr.addColorStop(0.8, 'rgba(0,0,0,0.26)');
  gr.addColorStop(1, 'rgba(0,0,0,0.5)');
  g.fillStyle = gr; g.fill();
}

// ----- Llantas -----
function drawWheel(g, cx, cy, r, style, ww, spin = 0, body = '#888', wide = false) {
  // neumático
  g.fillStyle = '#121214';
  g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  const tg = g.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
  tg.addColorStop(0, 'rgba(255,255,255,0)'); tg.addColorStop(0.82, 'rgba(255,255,255,0.08)'); tg.addColorStop(1, 'rgba(0,0,0,0.6)');
  g.fillStyle = tg; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  if (wide) { g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = r * 0.04; g.beginPath(); g.arc(cx, cy, r * 0.9, 0, TAU); g.stroke(); }
  // banda blanca
  if (ww) {
    g.fillStyle = '#efece2';
    g.beginPath(); g.arc(cx, cy, r * 0.84, 0, TAU); g.arc(cx, cy, r * 0.63, 0, TAU, true); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = r * 0.03; g.beginPath(); g.arc(cx, cy, r * 0.84, 0, TAU); g.stroke();
  }
  const rr = r * (ww ? 0.62 : 0.66);
  if (style === 'mags') {
    g.fillStyle = chromeGrad(g, cy + rr, cy - rr);
    g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.fill();
    g.fillStyle = '#3b3f45'; g.beginPath(); g.arc(cx, cy, rr * 0.86, 0, TAU); g.fill();
    g.fillStyle = chromeGrad(g, cy + rr, cy - rr);
    for (let i = 0; i < 5; i++) {
      const a = spin + i * TAU / 5;
      g.save(); g.translate(cx, cy); g.rotate(a);
      g.beginPath(); g.moveTo(-rr * 0.12, 0); g.lineTo(-rr * 0.2, rr * 0.84); g.lineTo(rr * 0.2, rr * 0.84); g.lineTo(rr * 0.12, 0); g.closePath(); g.fill();
      g.restore();
    }
    g.fillStyle = '#c9cfd6'; g.beginPath(); g.arc(cx, cy, rr * 0.25, 0, TAU); g.fill();
  } else if (style === 'moons') {
    const mg = g.createRadialGradient(cx - rr * 0.3, cy + rr * 0.35, rr * 0.1, cx, cy, rr);
    mg.addColorStop(0, '#ffffff'); mg.addColorStop(0.5, '#cfd6dd'); mg.addColorStop(0.85, '#7f8891'); mg.addColorStop(1, '#e6ebef');
    g.fillStyle = mg; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(cx - rr * 0.25, cy + rr * 0.3, rr * 0.18, 0, TAU); g.fill();
  } else {
    // llanta de acero pintada con tapa cromada
    g.fillStyle = css(shade(body, -0.25)); g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.fill();
    const hc = g.createRadialGradient(cx - rr * 0.25, cy + rr * 0.3, rr * 0.05, cx, cy, rr * 0.82);
    hc.addColorStop(0, '#ffffff'); hc.addColorStop(0.45, '#c3cbd3'); hc.addColorStop(0.8, '#69727b'); hc.addColorStop(1, '#d9dfe4');
    g.fillStyle = hc; g.beginPath(); g.arc(cx, cy, rr * 0.82, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(40,45,50,0.45)'; g.lineWidth = rr * 0.04;
    for (let i = 0; i < 6; i++) {
      const a = spin + i * TAU / 6;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * rr * 0.28, cy + Math.sin(a) * rr * 0.28); g.lineTo(cx + Math.cos(a) * rr * 0.72, cy + Math.sin(a) * rr * 0.72); g.stroke();
    }
    g.fillStyle = '#eef2f5'; g.beginPath(); g.arc(cx, cy, rr * 0.22, 0, TAU); g.fill();
    g.fillStyle = css(shade(body, -0.1)); g.beginPath(); g.arc(cx, cy, rr * 0.12, 0, TAU); g.fill();
  }
}

// Llamas: lenguas de fuego que nacen en la trompa y se curvan hacia atrás
const FLAME_TONGUES = [[4.6, 0.42, 1.8, -1], [3, 0.7, 2.6, 1], [-3.4, 0.6, 2.4, -1], [1, 1, 3.2, -1], [-1.2, 0.82, 3, 1]];
function drawFlames(g, A, color) {
  const x0 = 101.5, len = A.highboy ? 34 : 44, yMid = A.highboy ? 18 : A.belt - 6.2;
  const fg = g.createLinearGradient(x0, 0, x0 - len, 0);
  fg.addColorStop(0, '#fff6b0'); fg.addColorStop(0.25, '#ffd23a'); fg.addColorStop(0.6, '#ff7a14'); fg.addColorStop(1, '#d4210f');
  const edge = luma(color) > 0.6 ? '#7a1a10' : '#57b4ff';
  for (const [dy, fl, th, curl] of FLAME_TONGUES) {
    const y = yMid + dy, L = len * fl, xt = x0 - L, ty = y + curl * th * 1.1;
    g.beginPath();
    g.moveTo(x0, y + th / 2);
    g.bezierCurveTo(x0 - L * 0.45, y + th * 0.75, xt + L * 0.18, ty + th * 0.55, xt, ty);
    g.bezierCurveTo(xt + L * 0.22, ty - curl * th * 0.15 - th * 0.15, x0 - L * 0.5, y - th * 0.55, x0, y - th / 2);
    g.closePath();
    g.fillStyle = fg; g.fill();
    g.strokeStyle = edge; g.lineWidth = 0.3; g.stroke();
  }
}

// Dibuja el auto de lado. x, y = centro abajo (entre las ruedas, en el suelo). size = largo en píxeles.
// o: { flip (mira a la izquierda), spin (giro de ruedas), night (0..1 oscurece), lights (faros encendidos), part (parcial para el taller) }
function drawCarSide(g, car, x, y, size, o = {}) {
  const A = ART[car.model], M = MODELS[car.model], mods = car.mods || {};
  const s = size / 100, color = car.color;
  const lower = mods.lowered ? 1.2 : 0, chop = mods.chop ? 0.74 : 1;
  const tiresK = car.p && car.p.tires ? car.p.tires.k : M.stock.tires;
  const ww = tiresK === 'ww', wideRear = tiresK === 'slick' || tiresK === 'wide';
  const wheelStyle = mods.wheels || 'caps';
  const candy = (paintOf(color) || {}).candy;
  g.save();
  g.translate(x, y);
  g.scale(o.flip ? -s : s, -s);
  g.translate(-50, 0);
  // sombra en el suelo
  const sh = g.createRadialGradient(50, 0, 4, 50, 0, 58);
  sh.addColorStop(0, `rgba(0,0,0,${o.night ? 0.6 : 0.42})`); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.save(); g.scale(1, 0.09); g.fillStyle = sh; g.beginPath(); g.arc(50, 0, 58, 0, TAU); g.fill(); g.restore();

  const wr = A.wr, wrR = (A.wrRear || wr) * (wideRear ? 1.04 : 1);
  const [fx, rx] = A.wheels;
  const top = 34, bottom = 4;
  // cabina (techo y pilares), por detrás de la carrocería
  const belt = A.belt;
  const chopPts = pts => pts.map(p => [p[0], p[1] > belt + 0.5 ? belt + (p[1] - belt) * chop : p[1], p[2]]);
  const bodyPts = A.cabin ? A.body : chopPts(A.body);
  const crisp = M.year >= 1957 ? 0.28 : 0.5;
  const drawGlass = () => {
    for (const gl of A.glass) {
      polyPath(g, chopPts(gl), true, crisp);
      const gg = g.createLinearGradient(0, belt + 10 * chop, 0, belt);
      gg.addColorStop(0, o.night ? '#2a3550' : '#b9d4ea'); gg.addColorStop(0.45, o.night ? '#121a2a' : '#5d7a96'); gg.addColorStop(1, o.night ? '#05070c' : '#1d2a38');
      g.fillStyle = gg; g.fill();
      g.strokeStyle = chromeGrad(g, belt + 10, belt); g.lineWidth = 0.45; g.stroke();
      // reflejos diagonales en el vidrio
      g.save(); g.clip();
      g.fillStyle = 'rgba(255,255,255,0.14)';
      const gx = gl[0][0];
      g.beginPath(); g.moveTo(gx - 6, belt); g.lineTo(gx - 2, belt); g.lineTo(gx - 8, belt + 12); g.lineTo(gx - 12, belt + 12); g.fill();
      g.beginPath(); g.moveTo(gx - 14, belt); g.lineTo(gx - 12.5, belt); g.lineTo(gx - 18.5, belt + 12); g.lineTo(gx - 20, belt + 12); g.fill();
      g.restore();
    }
  };
  g.save(); g.translate(0, -lower);
  if (A.cabin) {
    polyPath(g, chopPts(A.cabin), true, crisp);
    paintBody(g, mods.roof || color, belt + 11 * chop, belt - 2, candy ? 1.1 : 0.75);
    drawGlass();
    if (A.vent) { g.strokeStyle = chromeGrad(g, belt + 9, belt); g.lineWidth = 0.4; g.beginPath(); g.moveTo(...A.vent[0]); g.lineTo(A.vent[1][0], belt + (A.vent[1][1] - belt) * chop); g.stroke(); }
    if (A.port) {
      const [px, py, pr] = A.port, pyc = belt + (py - belt) * chop;
      g.fillStyle = o.night ? '#0a0e16' : '#3e5870'; g.beginPath(); g.arc(px, pyc, pr * chop, 0, TAU); g.fill();
      g.strokeStyle = chromeGrad(g, pyc + pr, pyc - pr); g.lineWidth = 0.5; g.stroke();
    }
  }
  // asientos y parabrisas de los descapotables
  if (A.seat) {
    polyPath(g, A.seat, true); g.fillStyle = '#7a3b22'; g.fill();
    const sg = g.createLinearGradient(0, belt + 6, 0, belt); sg.addColorStop(0, 'rgba(255,255,255,0.25)'); sg.addColorStop(1, 'rgba(0,0,0,0.3)');
    g.fillStyle = sg; g.fill();
  }
  if (A.wheelRing) { g.strokeStyle = '#1a1a1a'; g.lineWidth = 0.7; g.beginPath(); g.ellipse(A.wheelRing[0], A.wheelRing[1], 0.6, 2.6, -0.3, 0, TAU); g.stroke(); }
  if (A.shield) {
    polyPath(g, chopPts(A.shield)); g.fillStyle = 'rgba(170,205,230,0.35)'; g.fill();
    g.strokeStyle = chromeGrad(g, 36, 24); g.lineWidth = 0.7; g.stroke();
  }
  g.restore();

  // carrocería
  g.save(); g.translate(0, -lower);
  if (A.frame) { g.strokeStyle = '#1b1b1d'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(...A.frame[0]); g.lineTo(...A.frame[1]); g.stroke(); }
  polyPath(g, bodyPts, true);
  paintBody(g, color, top - 6, bottom, candy ? 1.35 : 1);
  if (candy) {
    // escarchado: puntitos brillantes
    g.save(); g.clip();
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${0.15 + hash1(i, 3) * 0.3})`; g.fillRect(hash1(i, 1) * 100, 5 + hash1(i, 2) * 20, 0.25, 0.25); }
    g.restore();
  }
  if (!A.cabin && A.glass) drawGlass();
  // sombra suave alrededor de los arcos de las ruedas
  if (!A.highboy) {
    g.save(); polyPath(g, bodyPts, true); g.clip();
    for (const [wx, wrr] of [[fx, wr], [rx, wrR]]) {
      const ag = g.createRadialGradient(wx, wrr + lower, wrr * 1.15, wx, wrr + lower, wrr * 1.6);
      ag.addColorStop(0, 'rgba(0,0,0,0.35)'); ag.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = ag; g.fillRect(wx - wrr * 1.7, 0, wrr * 3.4, wrr * 3);
    }
    g.restore();
  }
  if (A.hood) {
    // capó con persianas y la línea del costado del roadster
    g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.25;
    g.beginPath(); g.moveTo(A.hood[0], 11.4); g.lineTo(A.hood[0], 24.9); g.stroke();
    for (let row = 0; row < 3; row++) for (let lx = A.hood[0] + 3; lx < A.hood[1] - 2; lx += 1.6) {
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(lx, 15.5 + row * 2.6, 0.5, 1.8);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(lx + 0.5, 15.5 + row * 2.6, 0.18, 1.8);
    }
    g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 0.35;
    g.beginPath(); g.moveTo(4, 20.6); g.bezierCurveTo(20, 21.4, 60, 21.4, A.hood[0], 21.2); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.25;
    g.beginPath(); g.moveTo(4, 20.2); g.bezierCurveTo(20, 21, 60, 21, A.hood[0], 20.8); g.stroke();
  }
  // panel de color secundario o anodizado
  if (A.cove) { polyPath(g, A.cove, true); g.fillStyle = css(luma(color) > 0.7 ? '#b3202a' : '#ece8dc'); g.fill(); g.strokeStyle = chromeGrad(g, 18, 8); g.lineWidth = 0.5; g.stroke(); }
  if (A.wedge) {
    polyPath(g, A.wedge); g.fillStyle = chromeGrad(g, 18, 11); g.fill();
    g.save(); g.clip(); g.strokeStyle = 'rgba(60,66,72,0.35)'; g.lineWidth = 0.25;
    for (let xx = 4; xx < 52; xx += 1.2) { g.beginPath(); g.moveTo(xx, 10); g.lineTo(xx, 19); g.stroke(); }
    g.restore();
  }
  if (A.gold) { polyPath(g, A.gold); g.fillStyle = goldGrad(g, 18, 12); g.fill(); }
  // decoraciones
  g.save(); polyPath(g, bodyPts, true); g.clip();
  if (mods.stripes) {
    g.fillStyle = luma(color) > 0.6 ? 'rgba(25,28,34,0.9)' : 'rgba(245,243,236,0.92)';
    g.fillRect(0, belt - 9.4, 101, 1.2); g.fillRect(0, belt - 7.6, 101, 0.6);
  }
  if (mods.flames) drawFlames(g, A, color);
  if (mods.pinstripe) {
    g.strokeStyle = luma(color) > 0.6 ? '#9b2a20' : '#f4e3a6'; g.lineWidth = 0.22;
    const py = belt - 3;
    for (const [cx, d] of [[88, 1], [12, -1]]) {
      g.beginPath();
      g.moveTo(cx - 6 * d, py); g.bezierCurveTo(cx - 2 * d, py + 2, cx + 2 * d, py - 2, cx + 5 * d, py - 0.5);
      g.bezierCurveTo(cx + 6.5 * d, py + 0.5, cx + 5 * d, py + 1.8, cx + 3.6 * d, py + 1);
      g.moveTo(cx - 6 * d, py); g.bezierCurveTo(cx - 2 * d, py - 2.2, cx + 1 * d, py - 2.6, cx + 3 * d, py - 1.6);
      g.stroke();
    }
  }
  g.restore();
  // líneas de puertas y manilla
  g.strokeStyle = 'rgba(0,0,0,0.38)'; g.lineWidth = 0.22;
  for (const d of A.doors) { g.beginPath(); g.moveTo(...d[0]); g.lineTo(...d[1]); g.stroke(); }
  if (A.handle) { g.fillStyle = chromeGrad(g, A.handle[1] + 0.5, A.handle[1] - 0.5); g.fillRect(A.handle[0], A.handle[1] - 0.35, 2.4, 0.7); }
  // molduras cromadas
  for (const t of A.trims) {
    g.strokeStyle = '#eef2f6'; g.lineWidth = 0.55; g.lineCap = 'round';
    g.beginPath(); g.moveTo(...t[0]); for (let i = 1; i < t.length; i++) g.lineTo(...t[i]); g.stroke();
    g.strokeStyle = 'rgba(70,78,86,0.7)'; g.lineWidth = 0.18;
    g.beginPath(); g.moveTo(t[0][0], t[0][1] - 0.22); for (let i = 1; i < t.length; i++) g.lineTo(t[i][0], t[i][1] - 0.22); g.stroke();
  }
  if (A.vents) for (const [vx, vy] of A.vents) { g.strokeStyle = chromeGrad(g, vy + 3, vy); g.lineWidth = 0.5; g.beginPath(); g.moveTo(vx, vy); g.lineTo(vx + 1.6, vy + 3.2); g.stroke(); }
  if (A.louvers) { g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.25; for (let lx = A.louvers[0]; lx < A.louvers[1]; lx += 1.4) { g.beginPath(); g.moveTo(lx, A.louvers[2]); g.lineTo(lx + 0.7, A.louvers[2] - 0.4); g.stroke(); } }
  if (A.ornaments) for (const [ox, oy] of A.ornaments) { g.fillStyle = chromeGrad(g, oy + 1, oy); g.beginPath(); g.moveTo(ox - 1.6, oy); g.lineTo(ox + 1.2, oy + 0.7); g.lineTo(ox + 1.4, oy); g.closePath(); g.fill(); }
  if (A.badge) { g.fillStyle = '#d33'; g.fillRect(A.badge[0], A.badge[1], 2, 0.8); g.fillStyle = '#eee'; g.fillRect(A.badge[0] + 0.2, A.badge[1] + 0.2, 1.6, 0.4); }
  if (A.scoop || mods.scoop) {
    const sc = A.scoop || [[76, belt + 0.1], [79.5, belt + 1.7], [87, belt + 1.6], [89, belt]];
    polyPath(g, sc, true); paintBody(g, color, belt + 2, belt, 1);
    g.fillStyle = '#0d0d0f'; g.fillRect(sc[2][0] - 0.2, sc[3][1] + 0.2, 0.9, (sc[2][1] - sc[3][1]) * 0.75);
  }
  // salpicaderas sueltas (autos antiguos)
  if (A.fenders) {
    for (const f of A.fenders) { polyPath(g, f, true); paintBody(g, color, 23, 9, candy ? 1.3 : 1); }
    g.fillStyle = '#1d1d1f'; polyPath(g, A.board); g.fill();
    g.fillStyle = chromeGrad(g, 9.8, 9.2); g.fillRect(A.board[0][0], 9.2, A.board[1][0] - A.board[0][0], 0.6);
  }
  if (A.grille) {
    polyPath(g, A.grille); g.fillStyle = chromeGrad(g, 25, 11); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.15; g.stroke();
    if (A.highboy) { g.fillStyle = chromeGrad(g, 27, 25); roundRect(g, 83.2, 25, 1.6, 1.6, 0.5); g.fill(); }
  }
  if (A.pipes) {
    // escapes laterales cromados (lakes pipes)
    g.fillStyle = chromeGrad(g, 11.4, 9.6); roundRect(g, 30, 9.6, 46, 1.8, 0.9); g.fill();
    g.fillStyle = '#222'; g.beginPath(); g.ellipse(30.2, 10.5, 0.4, 0.8, 0, 0, TAU); g.fill();
  }
  // huecos de las ruedas
  if (!A.highboy) {
    g.save();
    polyPath(g, bodyPts, true);
    if (A.fenders) for (const f of A.fenders) { splinePath(g, f, true); }
    g.clip();
    g.fillStyle = '#0b0b0c';
    for (const [wx, wrr] of [[fx, wr], [rx, wrR]]) { g.beginPath(); g.arc(wx, wrr + lower, wrr * 1.17, 0, TAU); g.fill(); }
    g.restore();
  }
  g.restore();

  // ruedas
  const spin = o.spin || 0;
  drawWheel(g, fx, wr, wr, wheelStyle, ww, spin, color);
  drawWheel(g, rx, wrR, wrR, wheelStyle, ww, spin, color, wideRear);
  g.save(); g.translate(0, -lower);
  // faldones traseros (Mercury)
  if (A.skirts && !mods.noskirt) {
    g.save(); polyPath(g, bodyPts, true); g.clip();
    g.beginPath(); g.rect(rx - wr * 1.25, 4, wr * 2.5, 24);
    paintBody(g, color, top - 6, bottom, candy ? 1.35 : 1);
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.25;
    g.beginPath(); g.moveTo(rx - wr * 1.2, 5.6); g.lineTo(rx - wr * 1.2, wr + 2); g.arc(rx, wr + 2, wr * 1.2, Math.PI, 0, true); g.lineTo(rx + wr * 1.2, 5.6); g.stroke();
    g.restore();
    g.strokeStyle = chromeGrad(g, 7, 5.5); g.lineWidth = 0.5; g.beginPath(); g.moveTo(rx - wr * 1.15, 6.4); g.lineTo(rx + wr * 1.15, 6.4); g.stroke();
  }
  // faros y focos traseros
  if (A.head) {
    const [hx, hy, hr] = A.head;
    g.fillStyle = chromeGrad(g, hy + hr, hy - hr); g.beginPath(); g.ellipse(hx, hy, hr * 0.55, hr, 0, 0, TAU); g.fill();
    g.fillStyle = o.lights ? '#fff8d8' : '#dfe8ee'; g.beginPath(); g.ellipse(hx + hr * 0.2, hy, hr * 0.32, hr * 0.78, 0, 0, TAU); g.fill();
  }
  if (A.lamp) {
    const [lx, ly, lr] = A.lamp;
    g.strokeStyle = '#1b1b1d'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(lx - 1, ly - lr); g.lineTo(lx - 2.6, 13); g.stroke();
    g.fillStyle = chromeGrad(g, ly + lr, ly - lr); g.beginPath(); g.ellipse(lx, ly, lr * 0.8, lr, 0, 0, TAU); g.fill();
    g.fillStyle = o.lights ? '#fff8d8' : '#e8eef2'; g.beginPath(); g.ellipse(lx + lr * 0.5, ly, lr * 0.3, lr * 0.8, 0, 0, TAU); g.fill();
  }
  if (A.tail) { polyPath(g, A.tail); g.fillStyle = o.lights ? '#ff2a1a' : '#b3141a'; g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(A.tail[0][0] + 0.2, A.tail[0][1] + 0.3, 0.4, (A.tail[2][1] - A.tail[0][1]) * 0.6); }
  // parachoques
  if (!mods.nobump) {
    for (const b of [A.bumpF, A.bumpR]) {
      polyPath(g, b, true); g.fillStyle = chromeGrad(g, Math.max(...b.map(p => p[1])), Math.min(...b.map(p => p[1]))); g.fill();
      g.strokeStyle = 'rgba(40,46,52,0.5)'; g.lineWidth = 0.15; g.stroke();
    }
  }
  g.restore();
  // contorno suave para que el auto se despegue del fondo
  g.restore();
  if (o.lights) {
    const dir = o.flip ? -1 : 1, hx = x + dir * (A.head ? A.head[0] - 50 : 40) * s, hy = y - (A.head ? A.head[1] : 22) * s;
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(g, hx, hy, 9 * s, '#fff1c8', 0.9);
    const beam = g.createLinearGradient(hx, hy, hx + dir * 60 * s, hy);
    beam.addColorStop(0, 'rgba(255,240,200,0.32)'); beam.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = beam; g.beginPath(); g.moveTo(hx, hy - 1.2 * s); g.lineTo(hx + dir * 60 * s, hy - 8 * s); g.lineTo(hx + dir * 60 * s, y + 2 * s); g.lineTo(hx, hy + 1.5 * s); g.fill();
    if (A.tail) glow(g, x - dir * (50 - A.tail[0][0]) * s, y - (A.tail[0][1] + 1.5) * s, 6 * s, '#ff2a1a', 0.7);
    g.restore();
  }
}

// Imagen cacheada del auto de lado (para el diario y las listas)
const _thumbs = new Map();
function carThumb(car, w = 220, h = 90) {
  const key = JSON.stringify([car.model, car.color, car.mods, car.p && car.p.tires && car.p.tires.k, w, h]);
  let url = _thumbs.get(key);
  if (!url) {
    const c = makeCanvas(w * 2, h * 2), g = c.getContext('2d');
    g.scale(2, 2);
    drawCarSide(g, car, w / 2, h - 8, w * 0.92);
    url = c.toDataURL();
    if (_thumbs.size > 120) _thumbs.clear();
    _thumbs.set(key, url);
  }
  return url;
}

// ----- De atrás: el rival en la carrera. w = ancho en píxeles; light = cuánto lo alumbran tus faros (0..1) -----
function drawCarRear(g, car, x, y, w, o = {}) {
  const A = ART[car.model], R = A.rear, light = clamp(o.light ?? 0.5, 0, 1);
  const h = w * 0.74, lit = c => css(mix('#05060a', c, 0.1 + light * 0.8));
  const paint = car.color, wide = car.p && car.p.tires && /slick|wide/.test(car.p.tires.k);
  const bodyB = -h * 0.13, belt = -h * (R.deck + (R.open ? 0 : 0.11)), roofT = -h * (R.open ? 0.66 : 0.98) + (car.mods.chop ? h * 0.06 : 0) + (car.mods.lowered ? h * 0.03 : 0);
  const low = car.mods.lowered ? h * 0.03 : 0;
  g.save(); g.translate(x, y);
  // sombra
  const sg = g.createRadialGradient(0, 0, 0, 0, 0, w * 0.62);
  sg.addColorStop(0, 'rgba(0,0,0,0.7)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  g.save(); g.scale(1, 0.12); g.fillStyle = sg; g.beginPath(); g.arc(0, 0, w * 0.62, 0, TAU); g.fill(); g.restore();
  g.translate(0, low);
  // neumáticos
  const tw = w * (wide ? 0.19 : 0.15);
  for (const d of [-1, 1]) {
    g.fillStyle = '#070707'; roundRect(g, d * w * 0.44 - tw / 2, -h * 0.24, tw, h * 0.24 - low, tw * 0.25); g.fill();
    g.fillStyle = `rgba(255,255,255,${0.04 + light * 0.06})`; g.fillRect(d * w * 0.44 - tw / 2 + tw * 0.15, -h * 0.22, tw * 0.12, h * 0.18);
  }
  // carrocería: maleta abombada en los autos antiguos, aletas en los de fines de los 50
  const rr = R.roundness, fin = R.fin * h * 0.13;
  g.beginPath();
  g.moveTo(-w * 0.47, bodyB);
  g.lineTo(-w * 0.5, belt + h * 0.12 * rr);
  if (fin > 1) { g.lineTo(-w * 0.5, belt - fin); g.lineTo(-w * 0.43, belt - fin * 0.3); g.lineTo(-w * 0.4, belt); }
  else g.quadraticCurveTo(-w * 0.5, belt, -w * (0.5 - 0.12 * rr), belt - h * 0.02 * rr);
  g.quadraticCurveTo(0, belt - h * (0.03 + 0.1 * rr), w * (fin > 1 ? 0.4 : 0.5 - 0.12 * rr), fin > 1 ? belt : belt - h * 0.02 * rr);
  if (fin > 1) { g.lineTo(w * 0.43, belt - fin * 0.3); g.lineTo(w * 0.5, belt - fin); g.lineTo(w * 0.5, belt + h * 0.12 * rr); }
  else g.quadraticCurveTo(w * 0.5, belt, w * 0.5, belt + h * 0.12 * rr);
  g.lineTo(w * 0.47, bodyB);
  g.closePath();
  g.fillStyle = lit(paint); g.fill();
  const bg = g.createLinearGradient(0, belt - fin, 0, bodyB);
  bg.addColorStop(0, `rgba(255,255,255,${0.1 + light * 0.28})`); bg.addColorStop(0.3, 'rgba(255,255,255,0.03)');
  bg.addColorStop(0.55, 'rgba(0,0,0,0.05)'); bg.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = bg; g.fill();
  // brillo a lo ancho de la maleta y línea de la tapa
  g.save(); g.clip();
  const sp = g.createRadialGradient(0, belt + h * 0.05, 0, 0, belt + h * 0.05, w * 0.5);
  sp.addColorStop(0, `rgba(255,255,255,${light * 0.22})`); sp.addColorStop(1, 'rgba(255,255,255,0)');
  g.save(); g.scale(1, 0.25); g.fillStyle = sp; g.fillRect(-w, (belt - h * 0.2) / 0.25, w * 2, h * 0.6 / 0.25); g.restore();
  g.restore();
  g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = Math.max(1, w * 0.006);
  g.beginPath(); g.moveTo(-w * 0.3, belt + h * 0.02); g.lineTo(-w * 0.3, bodyB - h * 0.12); g.lineTo(w * 0.3, bodyB - h * 0.12); g.lineTo(w * 0.3, belt + h * 0.02); g.stroke();
  // salpicaderas sueltas de los autos antiguos
  if (R.fenders) for (const d of [-1, 1]) {
    g.fillStyle = lit(shade(paint, -0.08));
    g.beginPath(); g.ellipse(d * w * 0.45, -h * 0.27, w * 0.11, h * 0.16, 0, Math.PI, 0); g.lineTo(d * w * 0.56, -h * 0.17); g.lineTo(d * w * 0.34, -h * 0.17); g.fill();
  }
  // cabina y vidrio trasero
  if (!R.open) {
    const rw = w * R.roofW * 0.88, bw = w * (0.36 + 0.03 * rr);
    const slope = R.fast ? h * 0.08 : 0;
    g.beginPath();
    g.moveTo(-bw, belt + 1);
    g.bezierCurveTo(-bw, belt - h * 0.1, -rw / 2 - w * 0.03, roofT + h * 0.06, -rw / 2, roofT + h * 0.02);
    g.quadraticCurveTo(0, roofT - h * 0.025 * (1 + rr), rw / 2, roofT + h * 0.02);
    g.bezierCurveTo(rw / 2 + w * 0.03, roofT + h * 0.06, bw, belt - h * 0.1, bw, belt + 1);
    g.closePath();
    g.fillStyle = lit(car.mods.roof || paint); g.fill();
    const cg = g.createLinearGradient(0, roofT, 0, belt);
    cg.addColorStop(0, `rgba(255,255,255,${0.12 + light * 0.2})`); cg.addColorStop(1, 'rgba(0,0,0,0.25)');
    g.fillStyle = cg; g.fill();
    // vidrio
    const gw = rw * 0.86, gb = bw * 0.82;
    g.beginPath();
    g.moveTo(-gb, belt - h * 0.06);
    g.bezierCurveTo(-gb, belt - h * 0.12, -gw / 2 - w * 0.02, roofT + h * 0.1 + slope, -gw / 2, roofT + h * 0.07 + slope);
    g.quadraticCurveTo(0, roofT + h * 0.045 + slope, gw / 2, roofT + h * 0.07 + slope);
    g.bezierCurveTo(gw / 2 + w * 0.02, roofT + h * 0.1 + slope, gb, belt - h * 0.12, gb, belt - h * 0.06);
    g.closePath();
    const gg = g.createLinearGradient(0, roofT, 0, belt);
    gg.addColorStop(0, '#2a3450'); gg.addColorStop(0.5, '#0c1220'); gg.addColorStop(1, '#03050a');
    g.fillStyle = gg; g.fill();
    g.strokeStyle = css(mix('#111', '#d9dfe5', light * 0.8)); g.lineWidth = Math.max(1, w * 0.008); g.stroke();
    // el conductor en silueta y un reflejo en el vidrio
    g.save(); g.clip();
    g.fillStyle = '#000'; g.beginPath(); g.ellipse(-w * 0.15, belt - h * 0.1, w * 0.065, h * 0.11, 0, 0, TAU); g.fill();
    g.fillRect(-w * 0.26, belt - h * 0.04, w * 0.22, h * 0.06);
    g.fillStyle = `rgba(255,255,255,${0.05 + light * 0.1})`;
    g.beginPath(); g.moveTo(w * 0.05, roofT); g.lineTo(w * 0.13, roofT); g.lineTo(-w * 0.02, belt); g.lineTo(-w * 0.1, belt); g.fill();
    g.restore();
  } else {
    // descapotable: el parabrisas visto desde atrás y el conductor
    g.fillStyle = '#000'; g.beginPath(); g.ellipse(-w * 0.15, belt - h * 0.12, w * 0.07, h * 0.11, 0, 0, TAU); g.fill();
    g.fillRect(-w * 0.27, belt - h * 0.05, w * 0.24, h * 0.06);
    g.strokeStyle = css(mix('#000', '#c9d1d8', light)); g.lineWidth = Math.max(1, w * 0.012);
    g.beginPath(); g.moveTo(-w * 0.34, belt); g.lineTo(-w * 0.31, belt - h * 0.26); g.lineTo(w * 0.31, belt - h * 0.26); g.lineTo(w * 0.34, belt); g.stroke();
  }
  // moldura cromada sobre la maleta
  g.strokeStyle = css(mix('#111', '#e8edf2', light * 0.9)); g.lineWidth = Math.max(1, w * 0.007);
  g.beginPath(); g.moveTo(-w * 0.46, belt + h * 0.08); g.lineTo(w * 0.46, belt + h * 0.08); g.stroke();
  // parachoques con sus guardas
  const bz = bodyB - h * 0.02;
  if (!car.mods.nobump) {
    const cb = g.createLinearGradient(0, bz - h * 0.08, 0, bz + h * 0.04);
    cb.addColorStop(0, css(mix('#111', '#ffffff', light))); cb.addColorStop(0.45, css(mix('#111', '#9aa3ab', light))); cb.addColorStop(0.55, css(mix('#050505', '#3c434a', light))); cb.addColorStop(1, css(mix('#111', '#c9d0d6', light)));
    g.fillStyle = cb; roundRect(g, -w * 0.53, bz - h * 0.08, w * 1.06, h * 0.11, h * 0.05); g.fill();
    for (const d of [-1, 1]) { roundRect(g, d * w * 0.24 - w * 0.025, bz - h * 0.15, w * 0.05, h * 0.18, w * 0.02); g.fill(); }
  }
  // patente de California (negra con letras amarillas) y su luz
  const pw = w * 0.2, ph = pw * 0.5, py = bz - h * 0.2;
  g.fillStyle = '#0c0c0c'; g.fillRect(-pw / 2, py, pw, ph);
  g.fillStyle = `rgba(240,200,60,${0.45 + light * 0.55})`; g.font = font(Math.max(5, ph * 0.62), 'bold', FONT_SANS);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.plate || 'KRL 163', 0, py + ph / 2 + 0.5);
  // escapes
  const dual = car.p && car.p.exhaust && car.p.exhaust.k === 'hdr';
  g.fillStyle = css(mix('#111', '#c9d0d6', light * 0.7));
  for (const d of dual ? [-1, 1] : [1]) { g.beginPath(); g.ellipse(d * w * 0.3, bz + h * 0.05, w * 0.03, w * 0.022, 0, 0, TAU); g.fill(); }
  // focos traseros (brillan más al frenar)
  const tl = o.brake ? 1 : 0.6, ly = belt + (bodyB - belt) * 0.35;
  const lamps = [];
  switch (R.lights) {
    case 'round2': lamps.push([-0.42, ly, 0.045], [-0.31, ly, 0.045], [0.31, ly, 0.045], [0.42, ly, 0.045]); break;
    case 'round1': lamps.push([-0.39, ly, 0.06], [0.39, ly, 0.06]); break;
    case 'tri': lamps.push([-0.44, ly, 0.038], [-0.345, ly, 0.038], [-0.25, ly, 0.038], [0.25, ly, 0.038], [0.345, ly, 0.038], [0.44, ly, 0.038]); break;
    case 'fin': lamps.push([-0.47, belt - fin * 0.55, 0.032, 2.4], [0.47, belt - fin * 0.55, 0.032, 2.4]); break;
    case 'vert': lamps.push([-0.455, ly, 0.03, 2.4], [0.455, ly, 0.03, 2.4]); break;
    case 'cat': lamps.push([-0.43, belt + h * 0.05, 0.04, 2.4], [0.43, belt + h * 0.05, 0.04, 2.4]); break;
    case 'bar': lamps.push([-0.34, ly, 0.11, 0.32], [0.34, ly, 0.11, 0.32]); break;
  }
  for (const [lx, lyy, lr, stretch = 1] of lamps) {
    g.fillStyle = css(mix('#111', '#d9dfe5', light * 0.8));
    g.beginPath(); g.ellipse(lx * w, lyy, lr * w * 1.25, lr * w * stretch * 1.15, 0, 0, TAU); g.fill();
    g.fillStyle = css(mix('#3a0505', '#ff2d1c', tl));
    g.beginPath(); g.ellipse(lx * w, lyy, lr * w, lr * w * stretch, 0, 0, TAU); g.fill();
    g.fillStyle = `rgba(255,220,200,${0.35 * tl})`; g.beginPath(); g.ellipse(lx * w - lr * w * 0.3, lyy - lr * w * stretch * 0.3, lr * w * 0.3, lr * w * stretch * 0.25, 0, 0, TAU); g.fill();
  }
  g.globalCompositeOperation = 'lighter';
  for (const [lx, lyy, lr] of lamps) glow(g, lx * w, lyy, lr * w * (o.brake ? 7.5 : 4.5), '#ff3020', o.brake ? 0.75 : 0.42);
  glow(g, 0, py + ph / 2, pw * 0.8, '#fff2c0', 0.22);
  g.restore();
}

// ----- De frente: autos que vienen en contra y la policía en el espejo -----
function drawCarFront(g, x, y, w, o = {}) {
  const h = w * 0.68;
  g.save(); g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.ellipse(0, 0, w * 0.56, w * 0.06, 0, 0, TAU); g.fill();
  const base = mix('#000', o.color || '#555', 0.12 + (o.light || 0) * 0.6);
  g.fillStyle = '#050505'; g.fillRect(-w * 0.46, -h * 0.18, w * 0.13, h * 0.18); g.fillRect(w * 0.33, -h * 0.18, w * 0.13, h * 0.18);
  roundRect(g, -w * 0.5, -h * 0.5, w, h * 0.42, w * 0.06); g.fillStyle = css(base); g.fill();
  g.beginPath(); g.moveTo(-w * 0.42, -h * 0.5); g.lineTo(-w * 0.32, -h * 0.92); g.lineTo(w * 0.32, -h * 0.92); g.lineTo(w * 0.42, -h * 0.5); g.closePath();
  g.fillStyle = css(mix('#000', o.roof || o.color || '#555', 0.1 + (o.light || 0) * 0.5)); g.fill();
  g.beginPath(); g.moveTo(-w * 0.36, -h * 0.52); g.lineTo(-w * 0.28, -h * 0.86); g.lineTo(w * 0.28, -h * 0.86); g.lineTo(w * 0.36, -h * 0.52); g.closePath();
  g.fillStyle = '#0b0f18'; g.fill();
  g.fillStyle = css(mix('#111', '#c8cfd6', (o.light || 0) * 0.8)); g.fillRect(-w * 0.3, -h * 0.34, w * 0.6, h * 0.12);
  // sirena de la policía
  if (o.cop) {
    const on = Math.sin(o.t * 14) > 0;
    g.fillStyle = on ? '#ff2020' : '#5a0a0a'; g.beginPath(); g.ellipse(0, -h * 0.97, w * 0.06, h * 0.07, 0, 0, TAU); g.fill();
    g.globalCompositeOperation = 'lighter';
    if (on) glow(g, 0, -h * 0.97, w * 0.9, '#ff2a2a', 0.8);
    g.globalCompositeOperation = 'source-over';
  }
  const hl = o.headlights ?? 1;
  g.fillStyle = css(mix('#444', '#fffbe8', hl));
  for (const d of [-1, 1]) { g.beginPath(); g.arc(d * w * 0.38, -h * 0.32, w * 0.06, 0, TAU); g.fill(); }
  g.globalCompositeOperation = 'lighter';
  for (const d of [-1, 1]) glow(g, d * w * 0.38, -h * 0.32, w * 0.9 * hl, '#fff4d6', 0.55 * hl);
  g.restore();
}

// ----- Retratos de los rivales -----
function drawPortrait(g, look, x, y, r) {
  g.save(); g.translate(x, y);
  g.beginPath(); g.arc(0, 0, r, 0, TAU); g.save(); g.clip();
  const bg = g.createLinearGradient(0, -r, 0, r); bg.addColorStop(0, '#2b3d5c'); bg.addColorStop(1, '#0f1626');
  g.fillStyle = bg; g.fillRect(-r, -r, r * 2, r * 2);
  const u = r / 50, wide = look.big ? 1.15 : look.slim ? 0.88 : 1;
  // hombros y chaqueta
  g.fillStyle = look.top;
  g.beginPath(); g.ellipse(0, 50 * u, 42 * u * wide, 30 * u, 0, Math.PI, 0); g.fill();
  if (look.collar) { g.fillStyle = css(shade(look.top, 0.25)); g.beginPath(); g.moveTo(-14 * u, 22 * u); g.lineTo(0, 34 * u); g.lineTo(14 * u, 22 * u); g.lineTo(18 * u, 30 * u); g.lineTo(0, 42 * u); g.lineTo(-18 * u, 30 * u); g.fill(); }
  if (look.tee) { g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 2 * u; g.beginPath(); g.arc(0, 22 * u, 10 * u, 0.1, Math.PI - 0.1); g.stroke(); }
  // cuello y cara
  g.fillStyle = css(shade(look.skin, -0.12)); g.fillRect(-7 * u, 8 * u, 14 * u, 16 * u);
  g.fillStyle = look.skin;
  g.beginPath(); g.ellipse(0, -4 * u, 17 * u * wide, 21 * u, 0, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(-17 * u * wide, -2 * u, 3.5 * u, 5 * u, 0, 0, TAU); g.ellipse(17 * u * wide, -2 * u, 3.5 * u, 5 * u, 0, 0, TAU); g.fill();
  // pelo
  g.fillStyle = look.hc;
  const hw = 18 * u * wide;
  switch (look.hair) {
    case 'pomp':
      g.beginPath(); g.moveTo(-hw, -2 * u); g.bezierCurveTo(-hw - 2 * u, -26 * u, -6 * u, -36 * u, 10 * u, -34 * u);
      g.bezierCurveTo(24 * u, -32 * u, hw + 4 * u, -18 * u, hw, -2 * u); g.bezierCurveTo(hw - 2 * u, -14 * u, 0, -18 * u, -hw + 2 * u, -10 * u); g.fill(); break;
    case 'duck':
      g.beginPath(); g.moveTo(-hw, 0); g.bezierCurveTo(-hw - 3 * u, -24 * u, -2 * u, -32 * u, 12 * u, -29 * u);
      g.bezierCurveTo(hw + 6 * u, -22 * u, hw + 2 * u, -6 * u, hw, 2 * u); g.bezierCurveTo(hw - 4 * u, -16 * u, -8 * u, -17 * u, -hw + 1 * u, -8 * u); g.fill();
      g.beginPath(); g.moveTo(0, -27 * u); g.quadraticCurveTo(-4 * u, -18 * u, -2 * u, -10 * u); g.lineTo(2 * u, -12 * u); g.fill(); break;
    case 'flat':
      g.fillRect(-hw, -27 * u, hw * 2, 12 * u); g.beginPath(); g.ellipse(0, -15 * u, hw, 6 * u, 0, Math.PI, 0); g.fill(); break;
    case 'buzz':
      g.beginPath(); g.ellipse(0, -12 * u, hw, 14 * u, 0, Math.PI, 0); g.fill(); break;
    case 'ponytail':
      g.beginPath(); g.ellipse(0, -10 * u, hw + 1 * u, 18 * u, 0, Math.PI, 0); g.fill();
      g.beginPath(); g.ellipse(hw + 6 * u, -4 * u, 6 * u, 16 * u, -0.4, 0, TAU); g.fill();
      if (look.bow) { g.fillStyle = look.bow; g.beginPath(); g.ellipse(hw + 1 * u, -20 * u, 5 * u, 3 * u, 0.6, 0, TAU); g.ellipse(hw + 6 * u, -22 * u, 5 * u, 3 * u, -0.6, 0, TAU); g.fill(); }
      break;
    case 'bob':
      g.beginPath(); g.moveTo(-hw - 3 * u, 12 * u); g.bezierCurveTo(-hw - 6 * u, -30 * u, hw + 6 * u, -30 * u, hw + 3 * u, 12 * u);
      g.lineTo(hw - 3 * u, 12 * u); g.bezierCurveTo(hw, -6 * u, 6 * u, -16 * u, -6 * u, -14 * u); g.bezierCurveTo(-hw + 2 * u, -10 * u, -hw + 1 * u, 2 * u, -hw + 3 * u, 12 * u); g.fill();
      if (look.bow) { g.fillStyle = look.bow; g.fillRect(-hw, -20 * u, hw * 2, 3.5 * u); }
      break;
    case 'beehive':
      g.beginPath(); g.ellipse(0, -26 * u, hw * 0.95, 20 * u, 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(0, -10 * u, hw + 2 * u, 14 * u, 0, Math.PI, 0); g.fill(); break;
  }
  // cara
  const eyeY = -4 * u;
  if (look.shades) {
    g.fillStyle = '#0a0a0a';
    roundRect(g, -14 * u, eyeY - 4 * u, 12 * u, 8 * u, 3 * u); g.fill(); roundRect(g, 2 * u, eyeY - 4 * u, 12 * u, 8 * u, 3 * u); g.fill();
    g.fillRect(-3 * u, eyeY - 2 * u, 6 * u, 1.6 * u);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-12 * u, eyeY - 3 * u, 4 * u, 1.4 * u); g.fillRect(4 * u, eyeY - 3 * u, 4 * u, 1.4 * u);
  } else {
    g.fillStyle = '#1b1410';
    g.beginPath(); g.ellipse(-7 * u, eyeY, 2 * u, 2.4 * u, 0, 0, TAU); g.ellipse(7 * u, eyeY, 2 * u, 2.4 * u, 0, 0, TAU); g.fill();
    g.strokeStyle = look.hc; g.lineWidth = 1.8 * u;
    g.beginPath(); g.moveTo(-11 * u, eyeY - 6 * u); g.lineTo(-3 * u, eyeY - 7 * u); g.moveTo(3 * u, eyeY - 7 * u); g.lineTo(11 * u, eyeY - 6 * u); g.stroke();
    if (look.glasses) { g.strokeStyle = '#222'; g.lineWidth = 1.4 * u; g.strokeRect(-12 * u, eyeY - 4 * u, 10 * u, 8 * u); g.strokeRect(2 * u, eyeY - 4 * u, 10 * u, 8 * u); }
    if (look.f) { g.strokeStyle = '#1b1410'; g.lineWidth = 1 * u; g.beginPath(); g.moveTo(-10 * u, eyeY - 2 * u); g.lineTo(-11 * u, eyeY - 4 * u); g.moveTo(10 * u, eyeY - 2 * u); g.lineTo(11 * u, eyeY - 4 * u); g.stroke(); }
  }
  if (look.freckles) { g.fillStyle = 'rgba(150,70,30,0.55)'; for (let i = 0; i < 8; i++) g.fillRect((hash1(i, 9) - 0.5) * 20 * u, eyeY + 4 * u + hash1(i, 4) * 5 * u, 1.3 * u, 1.3 * u); }
  g.fillStyle = css(shade(look.skin, -0.18)); g.beginPath(); g.moveTo(0, eyeY + 1 * u); g.lineTo(-2.5 * u, eyeY + 8 * u); g.lineTo(2 * u, eyeY + 8 * u); g.fill();
  if (look.mustache) { g.fillStyle = look.hc; g.beginPath(); g.ellipse(0, eyeY + 11 * u, 7 * u, 2 * u, 0, 0, TAU); g.fill(); }
  g.strokeStyle = look.bow && look.hair !== 'bob' ? '#b8323a' : css(shade(look.skin, -0.35)); g.lineWidth = 1.8 * u; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-6 * u, eyeY + 14 * u); g.quadraticCurveTo(1 * u, eyeY + 17 * u, 7 * u, eyeY + 13 * u); g.stroke();
  if (look.crown) {
    g.fillStyle = goldGrad(g, -48 * u, -32 * u);
    g.beginPath(); g.moveTo(-14 * u, -32 * u); g.lineTo(-16 * u, -46 * u); g.lineTo(-8 * u, -38 * u); g.lineTo(0, -50 * u); g.lineTo(8 * u, -38 * u); g.lineTo(16 * u, -46 * u); g.lineTo(14 * u, -32 * u); g.closePath(); g.fill();
    g.fillStyle = '#d0213a'; g.beginPath(); g.arc(0, -36 * u, 2 * u, 0, TAU); g.fill();
  }
  g.restore();
  g.lineWidth = Math.max(2, r * 0.06); g.strokeStyle = '#e9e2cf'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
  g.restore();
}
const _portraits = new Map();
function portraitURL(look, size = 96) {
  const key = JSON.stringify(look) + size;
  let url = _portraits.get(key);
  if (!url) {
    const c = makeCanvas(size * 2, size * 2), g = c.getContext('2d');
    drawPortrait(g, look, size, size, size - 3);
    url = c.toDataURL();
    _portraits.set(key, url);
  }
  return url;
}
