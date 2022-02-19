export class Vector {
  x: number;
  y: number;
  z: number;
  constructor(x: number, y: number, z?: number) {
    this.x = x;
    this.y = y;
    this.z = z ?? 0;
  }

  distance(v: Vector) {
    var dx = this.x - v.x,
      dy = this.y - v.y,
      dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  static distance(v1: Vector, v2: Vector) {
    return v1.distance(v2);
  }
}