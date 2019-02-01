// Copyright Brandon Ly 2015 all rights reserved.

// WebGL Code to also learn about implementing physically based rendering.

"use strict";

// Get our HTML WebGL Canvas.
var canvas = document.getElementById("webgl-canvas");
// if (canvas.webkitRequestFullScreen)
// {
//     canvas.webkitRequestFullScreen();
// }
// else
// {
//     canvas.mozRequestFullScreen();
// }

// Create our WebGL variable, where we will use our WebGL API functions.
var gl;

// Get the context into a local gl and and a public gl.
// Use preserveDrawingBuffer:true to keep the drawing buffer after
// presentation. Fail if context is not found.
try
{
    gl = WebGLUtils.setupWebGL(canvas);
}
catch (e)
{
    console.log("Getting context failed!");
}

// Render object references
var RenderObjectMesh;
var RenderObjectSkybox;

// Lighting and shading properties.
var LightPosition = GLMathLib.vec4(0.0, 10.0, 15.0, 0.0);
var LightDirectDir = GLMathLib.vec3(0.35, 0.75, 1.0);

var MatModel, MatView, MatProj, MatMV, MatMVP, MatNormal;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Main init and render loops.
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Init function.
function init()
{
    // Initialize the canvas.
    setCanvas();

    // Continue if WebGL works on the browser.
    gl.clearColor(0.0, 0.0, 0.0, 1.0);                      // Set the canvas background to pure black.
    gl.enable(gl.DEPTH_TEST);                               // Enable depth testing.
    gl.depthFunc(gl.LEQUAL);                                // Make near things obscure far things.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    // Clear the color as well as the depth buffer.
    gl.viewport(0, 0, canvas.width, canvas.height);         // Make the viewport adhere to the canvas size.

    // Initialize the renderable objects.

    var materialSkybox = new MaterialSkybox(gl);
    materialSkybox.setSkyboxTexture("Yokohama3");
    var MeshSkybox = Mesh.createCubeMap(500.0, materialSkybox);

    RenderObjectSkybox = new RenderObject(gl, MeshSkybox);

    // ARC Pulse Core with PBR-authored textures
    var meshMaterialPalletStack = new MaterialPBR(gl);
    meshMaterialPalletStack.setAlbedoTexture("assets/arc-pulse-core/textures/MAT_PalletStack_01_Base_Color.png");
    meshMaterialPalletStack.setNormalTexture("assets/arc-pulse-core/textures/MAT_PalletStack_01_Normal_DirectX.png");
    meshMaterialPalletStack.setMetallicTexture("assets/arc-pulse-core/textures/MAT_PalletStack_01_Metallic.png");
    meshMaterialPalletStack.setRoughnessTexture("assets/arc-pulse-core/textures/MAT_PalletStack_01_Roughness.png");

    var meshMaterialPulseFilter = new MaterialPBR(gl);
    meshMaterialPulseFilter.setAlbedoTexture("assets/arc-pulse-core/textures/MAT_PulseFilter_Base_Color.png");
    meshMaterialPulseFilter.setNormalTexture("assets/arc-pulse-core/textures/MAT_PulseFilter_Normal_DirectX.png");
    meshMaterialPulseFilter.setMetallicTexture("assets/arc-pulse-core/textures/MAT_PulseFilter_Metallic.png");
    meshMaterialPulseFilter.setRoughnessTexture("assets/arc-pulse-core/textures/MAT_PulseFilter_Roughness.png");

    var meshMaterialPallets = new MaterialPBR(gl);
    meshMaterialPallets.setAlbedoTexture("assets/arc-pulse-core/textures/MAT_Scifi_Pallets_Base_Color.png");
    meshMaterialPallets.setNormalTexture("assets/arc-pulse-core/textures/MAT_Scifi_Pallets_Normal_DirectX.png");
    meshMaterialPallets.setMetallicTexture("assets/arc-pulse-core/textures/MAT_Scifi_Pallets_Metallic.png");
    meshMaterialPallets.setRoughnessTexture("assets/arc-pulse-core/textures/MAT_Scifi_Pallets_Roughness.png");

    var meshMaterialArray = [];
    for (let i = 0; i < 36; i++)
    {
        meshMaterialArray.push(meshMaterialPalletStack);
    }
    meshMaterialArray[1] = meshMaterialPulseFilter;
    meshMaterialArray[2] = meshMaterialPallets;
    meshMaterialArray[22] = meshMaterialPallets;
    var mesh = Mesh.createMesh(
        gl,
        "assets/arc-pulse-core/source/PalletStack01_Paint/PalletStack01_Paint_v2.obj",
        meshMaterialArray
    );

    // Skyrim Claymore
    // var meshMaterial = new MaterialPBR(gl);
    // meshMaterial.setAlbedoTexture("assets/SkyrimIronClaymore/SkyrimIronClaymore.fbm/IronClaymore.jpg");
    // meshMaterial.setNormalTexture("assets/SkyrimIronClaymore/SkyrimIronClaymore.fbm/IronClaymore_n.jpg");
    // var mesh = Mesh.createMesh(
    //     gl,
    //     "assets/SkyrimIronClaymore/SkyrimIronClaymore.obj",
    //     [
    //         null,
    //         null,
    //         meshMaterial
    //     ]
    // );

    // var mesh = Mesh.createMesh(gl,
    //         FileUtil.GetFile("assets/SayoendMedievalHouse/SayoendMedievalHouse.obj"),
    //         "assets/SayoendMedievalHouse/Texture/SayoendMedievalHouse.jpg");
    // var mesh = Mesh.createMesh(FileUtil.GetFile("assets/RZ-0/RZ-0.obj"));

    RenderObjectMesh = new RenderObject(gl, mesh);

    // Create the transformation matrix and calculate other matrices.
    MatModel = GLMathLib.mat4(1.0);
    MatView = GLMathLib.lookAt(Camera.at, Camera.eye, Camera.up);
    MatProj = GLMathLib.perspective(Settings.yFOV, Settings.aspectRatio, Settings.nearClipPlane, Settings.farClipPlane);
    MatMV = GLMathLib.mult(MatView, MatModel);
    MatNormal = GLMathLib.transpose(GLMathLib.inverse(MatMV));

    ////////////////////////////////////////////////////////////////////////////////

    Control.init();
    Control.setMouseSensitivity(3.5);

    // Add an event listener to the input box.
    // document.getElementById("obj-upload").addEventListener("change", function(e)
    // {
    //     var file = e.target.files[0];
    //     if (!file)
    //     {
    //         return;
    //     }
    //     var reader = new FileReader();
    //     reader.onload = function(e)
    //     {
    //         var contents = e.target.result;
    //         meshRenderer = Mesh.createMesh(contents);
    //         Buffer.mesh = createMeshBuffer(meshRender.vertices, meshRender.normals, meshRender.indices);
    //     };
    //     reader.readAsText(file);
    //     Buffer.mesh = createMeshBuffer(meshRender.vertices, meshRender.normals, meshRender.indices);
    // }, false);
}

// Render loop.
function render()
{
    window.requestAnimFrame(render, canvas);


    ////////////////////////////////////////////////////////////////////////////////
    // Perform general setup.

    // Create the camera transformation matrices.
    MatView = GLMathLib.mat4(1.0);
    MatView = GLMathLib.rotate(MatView, Control.var.angleX/Control.var.mouseSensitivity, GLMathLib.vec3(0, 1, 0));
    MatView = GLMathLib.rotate(MatView, Control.var.angleY/Control.var.mouseSensitivity, GLMathLib.vec3(1, 0, 0));
    MatView = GLMathLib.translate(MatView, GLMathLib.vec3(0, 0, Control.var.mouseScroll/Control.var.mouseSensitivity - 10));

    // Create a transformation matrix for only the skybox.
    var MatViewSkybox = GLMathLib.mat4(1.0);
    MatViewSkybox = GLMathLib.rotate(MatViewSkybox, Control.var.angleX/Control.var.mouseSensitivity, GLMathLib.vec3(0, 1, 0));
    MatViewSkybox = GLMathLib.rotate(MatViewSkybox, Control.var.angleY/Control.var.mouseSensitivity, GLMathLib.vec3(1, 0, 0));



    ////////////////////////////////////////////////////////////////////////////////
    // Draw skybox.

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);

    // Apply transformations.
    var MatSkybox = GLMathLib.mat4(1.0);
    MatSkybox = GLMathLib.mult(MatViewSkybox, MatSkybox);
    MatSkybox = GLMathLib.mult(MatProj, MatSkybox);
    RenderObjectSkybox.setUniformValue("UMatMVP", GLMathLib.flatten(MatSkybox));

    // Render.
    RenderObjectSkybox.render();

    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);



    ////////////////////////////////////////////////////////////////////////////////
    // Draw general meshes.

    // Pass in the camera position in world space.
    var NewCameraPosition = GLMathLib.mult(GLMathLib.inverse(MatView), GLMathLib.vec4(0, 0, 0, 1.0));
    RenderObjectMesh.setUniformValue("UCamPosition", NewCameraPosition);

    // Set the light position.
    RenderObjectMesh.setUniformValue("ULightPosition", LightPosition);
    RenderObjectMesh.setUniformValue("ULightDirectDir", LightDirectDir);

    // Apply transformations.
    var MatMesh = GLMathLib.mat4(1.0);
    RenderObjectMesh.setUniformValue("UMatModel", GLMathLib.flatten(MatMesh));
    MatMesh = GLMathLib.mult(MatView, MatMesh);
    RenderObjectMesh.setUniformValue("UMatView", GLMathLib.flatten(MatMesh));
    RenderObjectMesh.setUniformValue("UMatMV", GLMathLib.flatten(MatMesh));
    MatNormal = GLMathLib.transpose(GLMathLib.inverse(MatMesh));
    RenderObjectMesh.setUniformValue("UMatNormal", GLMathLib.flatten(MatNormal));
    RenderObjectMesh.setUniformValue("UMatProj", GLMathLib.flatten(MatProj));

    MatMesh = GLMathLib.mult(MatProj, MatMesh);
    RenderObjectMesh.setUniformValue("UMatMVP", GLMathLib.flatten(MatMesh));

    // Render.
    RenderObjectMesh.render();



}

window.onresize = () =>
{
    // Reset the canvas and viewport whenever the window is resized.
    setCanvas();
    gl.viewport(0, 0, canvas.width, canvas.height);
};

// Load it all!
window.onload = () =>
{
    // Initialize the WebGL canvas.
    init();

    // Render the WebGL canvas.
    render();
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Helper functions.
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Initialize separate settings for the canvas.
function setCanvas()
{
    var innerAspectRatio = window.innerWidth / window.innerHeight;
    var canvasWidth, canvasHeight;
    if (innerAspectRatio > Settings.aspectRatio)
    {
        canvasHeight = window.innerHeight;
        canvasWidth = canvasHeight * Settings.aspectRatio;
    }
    else
    {
        canvasWidth = window.innerWidth;
        canvasHeight = canvasWidth * 1.0 / Settings.aspectRatio;
    }
    canvas.setAttribute("width", String(canvasWidth));
    canvas.setAttribute("height", String(canvasHeight));
}
