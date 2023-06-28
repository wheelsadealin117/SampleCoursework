"use strict";

var canvas;
var gl;

var numPositions  = 60;

var positions = [];
var colors = [];
var vertices = []

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;

var xformLoc;
var amountSpeen = 1;

var transSchmoovement = [0.1,0.1,0.1];
var getBig = [0.1,0.1,0.1];

var filename = "cow.smf";
var final_originVec = vec3(0,0,0);
var projectionMatrix;
var modelViewMatrix;
var radius = 0; 
var height = 1;
var theta = 0;
var phi = 90;

var eye = vec3(0,1,1);
var at = vec3(0,0,0);
var up= vec3(0,1,0);
var fovy = 60;
var aspect = 1;
var near = 0.01;
var far = 1000;
var modelViewMatrixLoc;
var projectionMatrixLoc;
var minArr;
var maxArr;

var state = true;

var lightAmbient = vec3( 0.5, 0.5, 0.5 );
var lightDiffuse = vec3( 0.6, 0.6, 0.6 );
var lightSpecular = vec3( 1.0, 1.0, 1.0 );
var lightPosition = vec3( 0.0, 1.0, 1.0 );


var materialAmbient = vec3(0.6, 0.2, 0.2);
var materialDiffuse = vec3(0.9, 0.1, 0.1);
var materialSpecular = vec3(0.8, 0.8, 0.8);
var materialShininess = 80.0;

var shaderOption = 1;
var program;

window.onload = function init()
{
    shaderOption = 0;
    main();
}
function main(){
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    //colorCube();
    var e = document.getElementById("mySelect2");
    var value = e.options[e.selectedIndex].value;
    filename=value;
    loadSMF();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    if(shaderOption == 0){
        program = initShaders(gl, "phong-vertex-shader", "phong-fragment-shader");
    }
    else{
        program = initShaders(gl, "gouraud-vertex-shader", "gouraud-fragment-shader");
    }
    gl.useProgram(program);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation( program, "aNormal" );
    gl.vertexAttribPointer( colorLoc, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( colorLoc );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);


    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    xformLoc = gl.getUniformLocation(program, "u_xform_mat");
    
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    render();
}

function colorCube()
{
    quad(1, 2, 3);
    quad(1, 4, 2);
    quad(5, 6, 7);
    quad(6, 5, 8);
    quad(3, 7, 9);
    quad(7, 3, 10);
    quad(11, 10, 2);
    quad(10, 11, 5);
    quad(4, 8, 11);
    quad(8, 4, 12);
    quad(9, 12, 1);
    quad(12, 9, 6);
    quad(3, 2, 10);
    quad(1, 3, 9);
    quad(5, 7, 10);
    quad(7, 6, 9);
    quad(2, 4, 11);
    quad(4, 1, 12);
    quad(5, 11, 8);
    quad(6, 8, 12);
}

function quad(a, b, c)
{
    a-=1;
    b-=1;
    c-=1;
    /*var vertices = [
        vec3(0.850651, 0, 0.525731),
        vec3(0.850651, 0, -0.525731),
        vec3(0.525731, 0.850651, 0),
        vec3(0.525731, -0.850651, 0),
        vec3(-0.850651, 0, -0.525731),
        vec3(-0.850651, 0, 0.525731),
        vec3(-0.525731, 0.850651, 0),
        vec3(-0.525731, -0.850651, 0),
        vec3(0, 0.525731, 0.850651),
        vec3(0, 0.525731, -0.850651),
        vec3(0, -0.525731, -0.850651),
        vec3(0, -0.525731, 0.850651)
    ];*/
    // We need to partition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [a, b, c];
    // var tempVec = [];
    // for(var j = 0; j <3; j++){
    //     tempVec.push(vec3(Math.abs(vertices[indices[j]][0]),Math.abs(vertices[indices[j]][1]),Math.abs(vertices[indices[j]][2])));
    // }

    var n = normalize(cross(subtract(vertices[b],vertices[a]),subtract(vertices[c],vertices[a])));
    //var n = normalize(cross(subtract(tempVec[b],tempVec[a]),subtract(tempVec[c],tempVec[a])));
    n = vec3(Math.abs(n[0]),Math.abs(n[1]),Math.abs(n[2]));
    for ( var i = 0; i < indices.length; ++i ) {
        positions.push( vertices[indices[i]] );
        colors.push(n);
    }
    //console.log(positions.length);
}

function normalizeVertexColor()
{
    var vertexAppearances = [];
    for(var i = 0; i<vertices.length;i++){
        vertexAppearances.push([vertices[i],[]]);
        vertexAppearances.push([i,[]]);
        for(var j = 0; j<positions.length; j++){
            if(positions[j] == vertices[i]){
                vertexAppearances[i][1].push(j);
            }
        }
    }
    //console.log(vertexAppearances);
    for(var i = 0; i<vertexAppearances.length;i++){
        var tempNormalizedVector = new vec3();
        for(var j = 0; j<vertexAppearances[i][1].length; j++){
            if(tempNormalizedVector == new vec3()){
                tempNormalizedVector = colors[vertexAppearances[i][1][j]];
            }
            else{
                var u = add(tempNormalizedVector, colors[vertexAppearances[i][1][j]]);
                tempNormalizedVector = vec3(u[0]/2, u[1]/2, u[2]/2);
            }
        }
        for(var j = 0; j<vertexAppearances[i][1].length; j++){
            colors[vertexAppearances[i][1][j]] = tempNormalizedVector;;
        }
    }
}
function render()
{
    getOriginPoint();
    //far *= minArr[0];
    //near *= maxArr[0];
    //console.log(far);
    //console.log(maxArr);
    var final_radius = radius+Math.max(maxArr[0]+maxArr[1]+maxArr[2]);

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(state){
        eye = vec3(final_radius*Math.cos(theta), height+final_originVec[1],final_radius*Math.sin(theta));
        //console.log(radius*Math.cos(degrees_to_radians(height)));
        
    }
    else{
        eye = vec3(final_radius*Math.cos(theta), final_radius*Math.sin(degrees_to_radians(height)),final_radius*Math.sin(theta));
        //eye = vec3(radius*Math.cos(theta), radius*Math.tan(theta),radius*Math.sin(theta));
        //eye = vec3(radius*Math.sin(theta)*Math.cos(phi), radius*Math.cos(theta),radius*Math.sin(theta)*Math.sin(phi));
      //  eye = vec3(radius*Math.cos(theta)*Math.cos(phi),radius*Math.sin(theta)*Math.sin(phi),radius*Math.cos(theta));
    }
    at = final_originVec;
    //up = final_originVec;
    //at = vec3(-0.000011139423611883833, 0.00004273394903749861, -0.0000022718927339490377);
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fovy, aspect, near, far);
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    var test = gl.getUniformLocation(program,"lightPosition");
    //console.log(test);
   //console.log(modelViewMatrix);
   //console.log(lightPosition.type);
    var test2 = mult(modelViewMatrix, lightPosition);
   //console.log(modelViewMatrix.type);
    //lightPosition = eye;
    gl.uniform3fv(gl.getUniformLocation(program,"ambientProduct"), flatten(ambientProduct));
    gl.uniform3fv(gl.getUniformLocation(program,"diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform3fv(gl.getUniformLocation(program,"specularProduct"), flatten(specularProduct) );
    gl.uniform3fv(gl.getUniformLocation(program,"lightPosition"),flatten(lightPosition) );
    gl.uniform1f(gl.getUniformLocation(program, "shininess"),materialShininess);


    gl.drawArrays(gl.TRIANGLES, 0, positions.length);
    //console.log(radius);
    //console.log(maxArr[0],maxArr[1],maxArr[2]);
    //console.log(minArr[0],minArr[1],minArr[2]);

    
}

function loadSMF(){
    var smf_file = loadFileAJAX(filename); 
    var lines = smf_file.split('\n');
    var facesArray = [];
    for(var line = 0; line < lines.length; line++){
        var strings = lines[line].trimEnd().split(' ');
        switch(strings[0]){
            case('v'):
            vertices.push(vec3(strings[1],strings[2],strings[3]));
            break;
            case('f'):
            facesArray.push(vec3(strings[1],strings[2],strings[3]));
            break;
        }
    }
    for(var i = 0; i<facesArray.length;i++){
        quad(facesArray[i][0],facesArray[i][1],facesArray[i][2]);
    }
    normalizeVertexColor();
}

function selectFile(value){
    //var e = document.getElementById("mySelect2");
    //var value = e.options[e.selectedIndex].value;
   //console.log(value);
    filename = value;
    //loadSMF();
    canvas;
    gl;

    numPositions  = 60;
    positions = [];
    colors = [];
    vertices = []
    xAxis = 0;
    yAxis = 1;
    zAxis = 2;


    xformLoc;
    amountSpeen = 1;

    transSchmoovement = [0.1,0.1,0.1];
    getBig = [0.1,0.1,0.1];
    main();

}

function getOriginPoint(){
    var originVec = vec3(parseFloat(vertices[0][0]),parseFloat(vertices[0][1]),parseFloat(vertices[0][2]));
    var maxX = originVec[0];
    var maxY = originVec[1];
    var maxZ = originVec[2];
    var minX = originVec[0];
    var minY = originVec[1];
    var minZ = originVec[2];
    var tempMaxArr = [maxX,maxY,maxZ];
    var tempMinArr = [minX,minY,minZ];
    for(var i = 0; i<vertices.length;i++){
        for(var j = 0; j<3; j++){
            originVec[j]+=parseFloat(vertices[i][j]);
            if(parseFloat(vertices[i][j]) > tempMaxArr[j]){
                tempMaxArr[j] = parseFloat(vertices[i][j]);
            }
            else if(parseFloat(vertices[i][j]) < tempMinArr[j]){
                tempMinArr[j] = parseFloat(vertices[i][j]);
            }
        }
    }
    maxArr = tempMaxArr;
    minArr = tempMinArr;
    final_originVec = vec3((originVec[0]/vertices.length),(originVec[1]/vertices.length),(originVec[2]/vertices.length));
    
}

function speen(k, value){
    if(k == 0){
        theta+=degrees_to_radians(value);
    }
    else if(k == 1){
        if(state){
            height+=value;
            //console.log(height);
        }
         else{
            height+=value;
            if(height>90){
                height=90;
            }
            else if(height<-90){
                height = -90;
            }
           //console.log(height);
           //console.log("phi");
         }
    }
    else if(k == 2){
        radius+=value;
    }
    render();
}
function changeState(value){
    //console.log(value);
    if(value == 1){
        state = false;
    }
    else{
        state = true;
    }
    render();
}
function degrees_to_radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);;
}
function blueRinse(){
    canvas;
    gl;

    numPositions  = 60;
    positions = [];
    colors = [];
    vertices = []

    xAxis = 0;
    yAxis = 1;
    zAxis = 2;

    axis = 0;
    xformLoc;
    amountSpeen = 1;

    transSchmoovement = [0.1,0.1,0.1];
    getBig = [0.1,0.1,0.1];

    filename = "cow.smf";
    final_originVec = vec3(0,0,0);
    projectionMatrix;
    modelViewMatrix;
    radius = 0; 
    height = 1;
    theta = 0;
    phi = 90;

    eye = vec3(0,1,1);
    at = vec3(0,0,0);
    up= vec3(0,1,0);
    fovy = 60;
    aspect = 1;
    near = 0.01;
    far = 1000;
    modelViewMatrixLoc;
    projectionMatrixLoc;
    minArr;
    maxArr;
    main();
}
function toggleShader(value){
    shaderOption = value;
    main();
}
