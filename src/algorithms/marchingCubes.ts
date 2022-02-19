import { Geometry, Mesh, Orientation, Scene, StandardMaterial, Vector2, Vector3, VertexData } from "@babylonjs/core";
import { edgeTable, triTable } from "./marchingCubesLookupTables";
import SimplexNoise from 'simplex-noise';

export class MarchingCubes {
  scene: Scene;
  points: Vector3[];
  values: number[];
  resolution: number;

  constructor(resolution: number, radius: number, scene: Scene) {
    this.scene = scene;
    this.points = [];
    this.values = [];
    this.resolution = resolution;
    const caveNoiseGenerator = new SimplexNoise("testseed-caves");
    const mountainNoiseGenerator = new SimplexNoise("testseed-mountains");

    // number of cubes along a side
    // this.resolution = 20;

    const divisable = resolution / radius;

    var axisMin = -radius;
    var axisMax =  radius;
    var axisRange = axisMax - axisMin;
    
    // Generate a list of 3D this.points and values at those this.points
    for (var k = 0; k < this.resolution; k++)
    for (var j = 0; j < this.resolution; j++)
    for (var i = 0; i < this.resolution; i++)
    {
      // actual values
      var x = axisMin + axisRange * i / (this.resolution - 1);
      var y = axisMin + axisRange * j / (this.resolution - 1);
      var z = axisMin + axisRange * k / (this.resolution - 1);
      const point = new Vector3(x,y,z);
      this.points.push( point );
      const sphereSdf = radius - Vector3.Distance(Vector3.Zero(), point);
      // var value = sphereSdf < 0 ? Math.abs(sphereSdf) : caveNoiseGenerator.noise3D(x / 5 ,y / 5 ,z / 5);

      const caveNoiseValue = caveNoiseGenerator.noise3D(x / divisable, y / divisable, z / divisable);
      const caveValue = sphereSdf < 0
        ? caveNoiseValue
        : sphereSdf;

      const mountainNoiseValue = mountainNoiseGenerator.noise3D(x / divisable, y / divisable, z / divisable);
      const mountainValue = sphereSdf > 0
        ? mountainNoiseValue
        : sphereSdf;
      // const mountainValue = mountainNoiseGenerator.noise3D(x / 5, y / 5, z / 5);
      // const lerp = mountainValue + (caveValue - mountainValue) * sphereSdf
      const value = sphereSdf - caveValue + mountainValue
      // const value = lerp
      this.values.push( value );
    }
    
    // Marching Cubes Algorithm
    
    var size2 = this.resolution * this.resolution;

    // Vertices may occur along edges of cube, when the this.values at the edge's endpoints
    //   straddle the isolevel value.
    // Actual position along edge weighted according to function this.values.
    var vlist = new Array<Vector3>(12);
    
    var vertexData = new VertexData();
    var positions: number[] = [];
    var indices: number[] = [];
    var uvs: number[] = [];
    var vertexIndex = 0;
    
    for (var z = 0; z < this.resolution - 1; z++)
    for (var y = 0; y < this.resolution - 1; y++)
    for (var x = 0; x < this.resolution - 1; x++)
    {
      // index of base point, and also adjacent this.points on cube
      var p    = x + this.resolution * y + size2 * z,
        px   = p   + 1,
        py   = p   + this.resolution,
        pxy  = py  + 1,
        pz   = p   + size2,
        pxz  = px  + size2,
        pyz  = py  + size2,
        pxyz = pxy + size2;
      
      // store scalar this.values corresponding to vertices
      var value0 = this.values[ p    ],
        value1 = this.values[ px   ],
        value2 = this.values[ py   ],
        value3 = this.values[ pxy  ],
        value4 = this.values[ pz   ],
        value5 = this.values[ pxz  ],
        value6 = this.values[ pyz  ],
        value7 = this.values[ pxyz ];
      
      // place a "1" in bit positions corresponding to vertices whose
      //   isovalue is less than given constant.
      
      var isolevel = 0;
      
      var cubeindex = 0;
      if ( value0 < isolevel ) cubeindex |= 1;
      if ( value1 < isolevel ) cubeindex |= 2;
      if ( value2 < isolevel ) cubeindex |= 8;
      if ( value3 < isolevel ) cubeindex |= 4;
      if ( value4 < isolevel ) cubeindex |= 16;
      if ( value5 < isolevel ) cubeindex |= 32;
      if ( value6 < isolevel ) cubeindex |= 128;
      if ( value7 < isolevel ) cubeindex |= 64;
      
      // bits = 12 bit number, indicates which edges are crossed by the isosurface
      var bits = edgeTable[ cubeindex ];
      
      // if none are crossed, proceed to next iteration
      if ( bits === 0 ) continue;
      
      // check which edges are crossed, and estimate the point location
      //    using a weighted average of scalar this.values at edge endpoints.
      // store the vertex in an array for use later.
      var mu = 0.5; 
      
      // bottom of the cube
      if ( bits & 1 )
      {		
        // mu = ( isolevel - value0 ) / ( value1 - value0 );
        vlist[0] = Vector3.Lerp(this.points[p], this.points[px], mu );
      }
      if ( bits & 2 )
      {
        // mu = ( isolevel - value1 ) / ( value3 - value1 );
        vlist[1] = Vector3.Lerp(this.points[px], this.points[pxy], mu );
      }
      if ( bits & 4 )
      {
        // mu = ( isolevel - value2 ) / ( value3 - value2 );
        vlist[2] = Vector3.Lerp(this.points[py], this.points[pxy], mu );
      }
      if ( bits & 8 )
      {
        // mu = ( isolevel - value0 ) / ( value2 - value0 );
        vlist[3] = Vector3.Lerp(this.points[p], this.points[py], mu );
      }
      // top of the cube
      if ( bits & 16 )
      {
        // mu = ( isolevel - value4 ) / ( value5 - value4 );
        vlist[4] = Vector3.Lerp(this.points[pz], this.points[pxz], mu );
      }
      if ( bits & 32 )
      {
        // mu = ( isolevel - value5 ) / ( value7 - value5 );
        vlist[5] = Vector3.Lerp(this.points[pxz], this.points[pxyz], mu );
      }
      if ( bits & 64 )
      {
        // mu = ( isolevel - value6 ) / ( value7 - value6 );
        vlist[6] = Vector3.Lerp(this.points[pyz], this.points[pxyz], mu );
      }
      if ( bits & 128 )
      {
        // mu = ( isolevel - value4 ) / ( value6 - value4 );
        vlist[7] = Vector3.Lerp(this.points[pz], this.points[pyz], mu );
      }
      // vertical lines of the cube
      if ( bits & 256 )
      {
        // mu = ( isolevel - value0 ) / ( value4 - value0 );
        vlist[8] = Vector3.Lerp(this.points[p], this.points[pz], mu );
      }
      if ( bits & 512 )
      {
        // mu = ( isolevel - value1 ) / ( value5 - value1 );
        vlist[9] = Vector3.Lerp(this.points[px], this.points[pxz], mu );
      }
      if ( bits & 1024 )
      {
        // mu = ( isolevel - value3 ) / ( value7 - value3 );
        vlist[10] = Vector3.Lerp(this.points[pxy], this.points[pxyz], mu );
      }
      if ( bits & 2048 )
      {
        // mu = ( isolevel - value2 ) / ( value6 - value2 );
        vlist[11] = Vector3.Lerp(this.points[py], this.points[pyz], mu );
      }
      
      // construct triangles -- get correct vertices from triTable.
      var i = 0;
      cubeindex <<= 4;  // multiply by 16... 
      // "Re-purpose cubeindex into an offset into triTable." 
      //  since each row really isn't a row.
      
      // the while loop should run at most 5 times,
      //   since the 16th entry in each row is a -1.
      while ( triTable[ cubeindex + i ] != -1 ) 
      {
        var index1 = triTable[cubeindex + i];
        var index2 = triTable[cubeindex + i + 1];
        var index3 = triTable[cubeindex + i + 2];
        
        positions.push(...vlist[index1].asArray());
        positions.push(...vlist[index2].asArray());
        positions.push(...vlist[index3].asArray());
        indices.push(vertexIndex, vertexIndex+1, vertexIndex+2);

        uvs.push(
          0,0,
          0,1,
          1,1
        );

        vertexIndex += 3;
        i += 3;
      }
    }
    // vertexData.set(positions, "position");
    // vertexData.set(indices, "indices");
    vertexData.set(uvs, "uv");

    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.uvs = uvs;

    const normals: number[] = [];

    VertexData.ComputeNormals(positions, indices, normals, {"useRightHandedSystem": true});

    vertexData.normals = normals;

    console.log(vertexData);
    
    // vertexData.computeCentroids();
    // vertexData.computeFaceNormals();
    // vertexData.computeVertexNormals();

    const material = new StandardMaterial("cubeMat", scene);
    // material.sideOrientation = Orientation.CW
    material.diffuseColor.set(0.773, 0.647, 0.486);
    const mesh = new Mesh("marchingCubes", scene);
    vertexData.applyToMesh(mesh);
    // mesh.convertToFlatShadedMesh();
    mesh.createNormals(true);
    mesh.computeWorldMatrix();
    mesh.material = material;

    // scene.addMesh(mesh);
    
    // var colorMaterial =  new MeshLambertMaterial( {color: 0x0000ff, side: DoubleSide} );
    // var mesh = new Mesh( vertexData, colorMaterial );
    // scene.add(mesh);

  }
};
