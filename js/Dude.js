export default class Dude {
  constructor(dudeMesh, id, speed, scaling, scene) {
    this.dudeMesh = dudeMesh;
    this.id = id;
    this.scene = scene;
    this.scaling = scaling;

    if (speed) this.speed = speed;
    else this.speed = 1;

    // in case, attach the instance to the mesh itself, in case we need to retrieve
    // it after a scene.getMeshByName that would return the Mesh
    // SEE IN RENDER LOOP !
    dudeMesh.Dude = this;

    // scaling
    this.dudeMesh.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);

    // FOR COLLISIONS, let's associate a BoundingBox to the Dude

    // singleton, static property, computed only for the first dude we constructed
    // for others, we will reuse this property.
    if (Dude.boundingBoxParameters == undefined) {
      Dude.boundingBoxParameters = this.calculateBoundingBoxParameters();
    }

    this.bounder = this.createBoundingBox();
    this.bounder.dudeMesh = this.dudeMesh;
  }

  move(scene) {
    // as move can be called even before the bbox is ready.
    if (!this.bounder) return;

    // let's put the dude at the BBox position. in the rest of this
    // method, we will not move the dude but the BBox instead
    this.dudeMesh.position = new BABYLON.Vector3(
      this.bounder.position.x,
      this.bounder.position.y,
      this.bounder.position.z
    );

    // calculate the circular path
    let center = new BABYLON.Vector3(0, 0, 0); // center of the circle
    let radius = 5000; // radius of the circle
    let angle = Date.now() * 0.001; // current time in seconds

    // calculate the position of the dude along the circular path
    let x = center.x + radius * Math.sin(angle);
    let z = center.z + radius * Math.cos(angle);
    let y = center.y; // keep the dude at the same height

    // calculate the direction towards the circular path
    let targetPosition = new BABYLON.Vector3(x, y, z);
    let direction = targetPosition.subtract(this.bounder.position);
    let distance = direction.length();

    let dir = direction.normalize();
    let alpha = Math.atan2(-dir.x, -dir.z);
    this.dudeMesh.rotation.y = alpha;

    // move the bounding box instead of the dude
    if (distance > 0.1) {
      this.bounder.moveWithCollisions(
        dir.multiplyByFloats(this.speed, this.speed, this.speed)
      );
    }
  }

  calculateBoundingBoxParameters() {
    // Compute BoundingBoxInfo for the Dude, for this we visit all children meshes
    let childrenMeshes = this.dudeMesh.getChildren();
    let bbInfo = this.totalBoundingInfo(childrenMeshes);

    return bbInfo;
  }

  // Taken from BabylonJS Playground example : https://www.babylonjs-playground.com/#QVIDL9#1
  totalBoundingInfo(meshes) {
    var boundingInfo = meshes[0].getBoundingInfo();
    var min = boundingInfo.minimum.add(meshes[0].position);
    var max = boundingInfo.maximum.add(meshes[0].position);
    for (var i = 1; i < meshes.length; i++) {
      boundingInfo = meshes[i].getBoundingInfo();
      min = BABYLON.Vector3.Minimize(
        min,
        boundingInfo.minimum.add(meshes[i].position)
      );
      max = BABYLON.Vector3.Maximize(
        max,
        boundingInfo.maximum.add(meshes[i].position)
      );
    }
    return new BABYLON.BoundingInfo(min, max);
  }

  createBoundingBox() {
    // Create a box as BoundingBox of the Dude
    let bounder = new BABYLON.Mesh.CreateBox(
      "bounder" + this.id.toString(),
      1,
      this.scene
    );
    let bounderMaterial = new BABYLON.StandardMaterial(
      "bounderMaterial",
      this.scene
    );
    bounderMaterial.alpha = 0.4;
    bounder.material = bounderMaterial;
    bounder.checkCollisions = true;

    bounder.position = this.dudeMesh.position.clone();

    let bbInfo = Dude.boundingBoxParameters;

    let max = bbInfo.boundingBox.maximum;
    let min = bbInfo.boundingBox.minimum;

    // Not perfect, but kinda of works...
    // Looks like collisions are computed on a box that has half the size... ?
    bounder.scaling.x = (max._x - min._x) * this.scaling;
    bounder.scaling.y = (max._y - min._y) * this.scaling * 2;
    bounder.scaling.z = (max._z - min._z) * this.scaling * 3;

    //bounder.isVisible = false;

    return bounder;
  }
}
