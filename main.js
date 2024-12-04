// Canvas stuff
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const DESIRED_FPS = 10;
const SCREEN_WIDTH = canvas.width;
const SCREEN_HEIGHT = canvas.height;
const BACKGROUND_GRADIENT = ctx.createLinearGradient(0,0,0,SCREEN_HEIGHT);
BACKGROUND_GRADIENT.addColorStop(0,"#C22600")
BACKGROUND_GRADIENT.addColorStop(1,"#000");

const animationDuration = 100;
let next = null;
let executing = null;
const currentKeys = [];
let animationKey = null;
let animationFps = 30;

// Map Stuff
const tileType = {
    DEFAULT: ["#DADADA","#A3A3A3"],
    HOLE: ["#393939","#1F1F1F"],
    ORANGE: ["#F88D15","#D67C17"]
}
let map = [
    tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,"\n",
    tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,"\n",
    tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,"\n",
    null,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT,"\n",
    null,null,null,null,null,tileType.DEFAULT,tileType.DEFAULT,tileType.HOLE,tileType.DEFAULT,tileType.DEFAULT,"\n",
    null,null,null,null,null,null,tileType.DEFAULT,tileType.DEFAULT,tileType.DEFAULT
];
let holeX = 7;
let holeZ = 4;
let offsetX = 0;
let offsetY = 0;
let loadedMap = [];

// Player Stuff
const PLAYERSTATE = {
    STANDING:0,
    LAYING_X:1,
    LAYING_Z:2,
    FALLING_W:3,
    FALLING_A:4,
    FALLING_S:5,
    FALLING_D:6,
    RISING_W:7,
    RISING_A:8,
    RISING_S:9,
    RISING_D:10,
    ROLLING_W:11,
    ROLLING_A:12,
    ROLLING_S:13,
    ROLLING_D:14
}
const CUBE_COLOR = ["#0f254a","#040e1f"]

let cube = {
    x: 1,
    z: 1,
    state: PLAYERSTATE.STANDING,
    rotationPercent: 0,
    points: null
}


// Setup
window.onload = function() {
    document.addEventListener("keydown",keyDown);
    document.addEventListener("keyup",keyUp);
    paintScreen();
}
window.onfocus = () => {
    paintScreen();
}

// Temp
function temp(val) {
    cube.rotationPercent = val;
    paintScreen();
}
function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
function plotPoint(p,clr = getRandomColor()) {
    let size = 5;
    ctx.fillStyle = clr;
    ctx.fillRect(p.x-size/2,p.y-size/2,size,size);
}
function lineBetween(a,b) {
    ctx.strokeStyle = "#FFF";
    ctx.beginPath();
    ctx.moveTo(a.x,a.y);
    ctx.lineTo(b.x,b.y);
    ctx.closePath();
    ctx.stroke();
}

// Generic functions
function lerp(delta, a, b) {
    return a + delta * (b-a);
}
function lerpPoints(delta,a,b) {
    return {x:lerp(delta,a.x,b.x),y:lerp(delta,a.y,b.y)};
}
function addPoints(a,b) {
    return {
        x: a.x + b.x,
        y: a.y + b.y
    }
}
function subractPoints(a,b) {
    return {
        x: a.x - b.x,
        y: a.y - b.y
    }
}
function dist(a,b) {
    return Math.sqrt(
        (a.x-b.x)**2 + (a.y-b.y)**2
    );
}

// Inputs
function updateQue(btn) {
    if (executing===btn) return;
    if (executing==null) {
        executing = btn;
        execute(executing);
        return;
    }
    if (next==null) next = btn;
}
function execute(btn) {
    let xMovement = 0;
    let zMovement = 0;
    let becomingState = PLAYERSTATE.STANDING;
    let steps = animationDuration/(1000/animationFps);
    let change = 100/steps;
    switch (btn) {
        case "W":
            switch (cube.state) {
                case PLAYERSTATE.STANDING:
                    cube.state = PLAYERSTATE.FALLING_W;
                    becomingState = PLAYERSTATE.LAYING_Z;
                    zMovement = -1;
                    break;
                case PLAYERSTATE.LAYING_X:
                    cube.state = PLAYERSTATE.ROLLING_W;
                    becomingState = PLAYERSTATE.LAYING_X;
                    zMovement = -1;
                    break;
                case PLAYERSTATE.LAYING_Z:
                    cube.state = PLAYERSTATE.RISING_W;
                    becomingState = PLAYERSTATE.STANDING;
                    zMovement = -2;
                    break;
            }
            break;
        case "A":
            switch (cube.state) {
                case PLAYERSTATE.STANDING:
                    cube.state = PLAYERSTATE.FALLING_A;
                    becomingState = PLAYERSTATE.LAYING_X;
                    xMovement = -1;
                    break;
                case PLAYERSTATE.LAYING_X:
                    cube.state = PLAYERSTATE.RISING_A;
                    becomingState = PLAYERSTATE.STANDING;
                    xMovement = -2;
                    break;
                case PLAYERSTATE.LAYING_Z:
                    cube.state = PLAYERSTATE.ROLLING_A;
                    becomingState = PLAYERSTATE.LAYING_Z;
                    xMovement = -1;
                    break;
            }
            break;
        case "S":
            switch (cube.state) {
                case PLAYERSTATE.STANDING:
                    cube.state = PLAYERSTATE.FALLING_S;
                    becomingState = PLAYERSTATE.LAYING_Z;
                    zMovement = 2;
                    break;
                case PLAYERSTATE.LAYING_X:
                    cube.state = PLAYERSTATE.ROLLING_S;
                    becomingState = PLAYERSTATE.LAYING_X;
                    zMovement = 1;
                    break;
                case PLAYERSTATE.LAYING_Z:
                    cube.state = PLAYERSTATE.RISING_S;
                    becomingState = PLAYERSTATE.STANDING;
                    zMovement = 1;
                    break;
            }
            break;
        case "D":
            switch (cube.state) {
                case PLAYERSTATE.STANDING:
                    cube.state = PLAYERSTATE.FALLING_D;
                    becomingState = PLAYERSTATE.LAYING_X;
                    xMovement = 2;
                    break;
                case PLAYERSTATE.LAYING_X:
                    cube.state = PLAYERSTATE.RISING_D;
                    becomingState = PLAYERSTATE.STANDING;
                    xMovement = 1;
                    break;
                case PLAYERSTATE.LAYING_Z:
                    cube.state = PLAYERSTATE.ROLLING_D;
                    becomingState = PLAYERSTATE.LAYING_Z;
                    xMovement = 1;
                    break;
            }
            break;
    }
    cube.rotationPercent = 0;
    animationKey = setInterval(() => {
        cube.rotationPercent+=change;
        paintScreen();
    },1000/animationFps);
    setTimeout(() => {
        clearInterval(animationKey);
        cube.x += xMovement;
        cube.z += zMovement;
        cube.state = becomingState;
        done();
        paintScreen();
    },animationDuration);
}
function done() {
    executing = structuredClone(next);
    next = null;
    if (executing!=null) {
        execute(executing);
    }
    if (getFoundation().includes(undefined)) {
        setTimeout(() => {
            cube.x = 1;
            cube.z = 1;
            cube.state = PLAYERSTATE.STANDING;
            console.log("LOST")
            paintScreen();
        },1);
    }
    if (cube.x==holeX&cube.z==holeZ&cube.state==PLAYERSTATE.STANDING) {
        setTimeout(() => {
            alert("YOU WIN")
        paintScreen();

        },1);
    }
}
function keyDown(e) {
    let knownKeys = [87,38,65,37,83,40,68,39];
    if (!knownKeys.includes(e.keyCode)) return;
    let keyMap = {W:[87,38],A:[65,37],S:[83,40],D:[68,39]};
    if (!currentKeys.includes(e.keyCode)) currentKeys.push(e.keyCode);
    Object.values(keyMap).forEach((n) => {
        if (n.includes(e.keyCode)) updateQue(Object.keys(keyMap)[Object.values(keyMap).indexOf(n)])
    });
    paintScreen();
    
}
function keyUp(e) {
    currentKeys.splice(currentKeys.indexOf(e.keyCode),currentKeys.indexOf(e.keyCode)==-1?0:1);
}

// Grid things
function rotateFromToAround(P, D, C, t, c = false) {
    let r = lerp(t,dist(C,P),dist(C,D));
    let i = lerpPoints(t,P,D);
    let control = {
        x: C.x + r * (i.x-C.x)/dist(i,C),
        y: C.y + r * (i.y-C.y)/dist(i,C)
    };
    let i1 = lerpPoints(t,P,control);
    let i2 = lerpPoints(t,control,D);
    let N = lerpPoints(t,i1,i2);
    return c ? control : N;
}
function getFoundation() {
    let blocks = []
    try {
        blocks[0] = loadedMap[cube.z][cube.x];
    } catch (TypeError) {
        blocks[0] = undefined;
    }
    try {
        if (cube.state==PLAYERSTATE.LAYING_X) {
            blocks[1] = loadedMap[cube.z][cube.x-1];
        }
        if (cube.state==PLAYERSTATE.LAYING_Z) {
            blocks[1] = loadedMap[cube.z-1][cube.x];
        }
    } catch (TypeError) {
        blocks[1] = undefined;
    }
    return blocks;
}
function shiftAccordingly(pos, x, z) {
    let newPos = {
        x: pos.x + x*30 + z*10,
        y: pos.y + x*-6 + z*16
    };
    return newPos;
}
function generateCubePoints(cubeData) {
    let height = 50;
    let points = {};
    let fraction = cubeData.rotationPercent/100;
    let start, end;
    let core = translatePointToTileGrid(cubeData.x,cubeData.z,offsetX,offsetY);

    let def = {x:0,y:0};
    points.bw = def;
    points.ba = def;
    points.bs = def;
    points.bd = def;
    points.uw = def;
    points.ua = def;
    points.us = def;
    points.ud = def;

    switch (cubeData.state) {
        default:
            points.ba = core;
            points.bs = shiftAccordingly(core,0,1);
            points.bw = shiftAccordingly(core,1,0);
            points.bd = shiftAccordingly(core,1,1);
            points.ua = {x:points.ba.x,y:points.ba.y-height};
            points.us = {x:points.bs.x,y:points.bs.y-height};
            points.uw = {x:points.bw.x,y:points.bw.y-height};
            points.ud = {x:points.bd.x,y:points.bd.y-height};
            break;
        case PLAYERSTATE.LAYING_X:
            core = translatePointToTileGrid(cubeData.x-1,cubeData.z,offsetX,offsetY)
            points.ba = core;
            points.bs = shiftAccordingly(core,0,1);
            points.bw = shiftAccordingly(core,2,0);
            points.bd = shiftAccordingly(core,2,1);
            points.ua = {x:points.ba.x,y:points.ba.y-height/2};
            points.us = {x:points.bs.x,y:points.bs.y-height/2};
            points.uw = {x:points.bw.x,y:points.bw.y-height/2};
            points.ud = {x:points.bd.x,y:points.bd.y-height/2};
            break;
        case PLAYERSTATE.LAYING_Z:
            core = translatePointToTileGrid(cubeData.x,cubeData.z-1,offsetX,offsetY)
            points.ba = core;
            points.bs = shiftAccordingly(core,0,2);
            points.bw = shiftAccordingly(core,1,0);
            points.bd = shiftAccordingly(core,1,2);
            points.ua = {x:points.ba.x,y:points.ba.y-height/2};
            points.us = {x:points.bs.x,y:points.bs.y-height/2};
            points.uw = {x:points.bw.x,y:points.bw.y-height/2};
            points.ud = {x:points.bd.x,y:points.bd.y-height/2};
            break;
        case PLAYERSTATE.FALLING_W:
            start = generateCubePoints({...cubeData,state:PLAYERSTATE.STANDING});
            end = generateCubePoints({...cubeData,state:PLAYERSTATE.LAYING_Z,z:cube.z-1});
            points.ba = start.ba;
            points.bw = start.bw;
            points.ua = rotateFromToAround(start.ua,end.ba,start.ba,fraction);
            points.uw = rotateFromToAround(start.uw,end.bw,start.bw,fraction);
            points.bs = rotateFromToAround(start.bs,end.us,start.ba,fraction);
            points.bd = rotateFromToAround(start.bd,end.ud,start.bw,fraction);
            points.us = rotateFromToAround(start.us,end.ua,start.ba,fraction);
            points.ud = rotateFromToAround(start.ud,end.uw,start.bw,fraction);
            break;
        case PLAYERSTATE.FALLING_A:
            start = generateCubePoints({...cubeData,state:PLAYERSTATE.STANDING});
            end = generateCubePoints({...cubeData,state:PLAYERSTATE.LAYING_X,x:cubeData.x-1});
            points.ba = start.ba;
            points.bs = start.bs;
            points.bw = rotateFromToAround(start.bw,end.uw,start.ba,fraction);
            points.bd = rotateFromToAround(start.bd,end.ud,start.ba,fraction);
            points.ua = rotateFromToAround(start.ua,end.ba,start.ba,fraction);
            points.us = rotateFromToAround(start.us,end.bs,start.bs,fraction);
            points.uw = rotateFromToAround(start.uw,end.ua,start.ba,fraction);
            points.ud = rotateFromToAround(start.ud,end.us,start.bs,fraction);
            break;
        case PLAYERSTATE.FALLING_S:
            start = generateCubePoints({...cubeData,state:PLAYERSTATE.STANDING});
            end = generateCubePoints({...cubeData,state:PLAYERSTATE.LAYING_Z,z:cubeData.z+2});
            points.bs = start.bs;
            points.bd = start.bd;
            points.ua = rotateFromToAround(start.ua,end.us,start.bs,fraction);
            points.uw = rotateFromToAround(start.uw,end.ud,start.bd,fraction);
            points.ba = rotateFromToAround(start.ba,end.ua,start.bs,fraction);
            points.bw = rotateFromToAround(start.bw,end.uw,start.bd,fraction);
            points.us = rotateFromToAround(start.us,end.bs,start.bs,fraction);
            points.ud = rotateFromToAround(start.ud,end.bd,start.bd,fraction);
            break;
        case PLAYERSTATE.FALLING_D:
            start = generateCubePoints({...cubeData,state:PLAYERSTATE.STANDING});
            end = generateCubePoints({...cubeData,state:PLAYERSTATE.LAYING_X,x:cubeData.x+2});
            points.ba = rotateFromToAround(start.ba,end.ua,start.bw,fraction);
            points.bs = rotateFromToAround(start.bs,end.us,start.bd,fraction);
            points.bw = start.bw;
            points.bd = start.bd;
            points.ua = rotateFromToAround(start.ua,end.uw,start.bw,fraction);
            points.us = rotateFromToAround(start.us,end.ud,start.bd,fraction);
            points.uw = rotateFromToAround(start.uw,end.bw,start.bw,fraction);
            points.ud = rotateFromToAround(start.ud,end.bd,start.bd,fraction);
            break;
        case PLAYERSTATE.RISING_W:
            points = generateCubePoints({...cubeData,state:PLAYERSTATE.FALLING_S,rotationPercent:100-cubeData.rotationPercent,z:cubeData.z-2})
            break;
        case PLAYERSTATE.RISING_A:
            points = generateCubePoints({...cubeData,state:PLAYERSTATE.FALLING_D,rotationPercent:100-cubeData.rotationPercent,x:cubeData.x-2})
            break;
        case PLAYERSTATE.RISING_S:
            points = generateCubePoints({...cubeData,state:PLAYERSTATE.FALLING_W,rotationPercent:100-cubeData.rotationPercent,z:cubeData.z+1})
            break;
        case PLAYERSTATE.RISING_D:
            points = generateCubePoints({...cubeData,state:PLAYERSTATE.FALLING_A,rotationPercent:100-cubeData.rotationPercent,x:cubeData.x+1})
            break;
        case PLAYERSTATE.ROLLING_W:
            start = generateCubePoints({...cubeData,state:PLAYERSTATE.LAYING_X});
            end = generateCubePoints({...cubeData,state:PLAYERSTATE.LAYING_X,z:cube.z-1});
            points.ba = start.ba;
            points.bw = start.bw;
            points.ua = rotateFromToAround(start.ua,end.ba,start.ba,fraction);
            points.uw = rotateFromToAround(start.uw,end.bw,start.bw,fraction);
            points.bs = rotateFromToAround(start.bs,end.us,start.ba,fraction);
            points.bd = rotateFromToAround(start.bd,end.ud,start.bw,fraction);
            points.us = rotateFromToAround(start.us,end.ua,start.ba,fraction);
            points.ud = rotateFromToAround(start.ud,end.uw,start.bw,fraction);
            break;
        case PLAYERSTATE.ROLLING_A:
            start = generateCubePoints({...cubeData,state:PLAYERSTATE.LAYING_Z});
            end = generateCubePoints({...cubeData,state:PLAYERSTATE.LAYING_Z,x:cubeData.x-1});
            points.ba = start.ba;
            points.bs = start.bs;
            points.bw = rotateFromToAround(start.bw,end.uw,start.ba,fraction);
            points.bd = rotateFromToAround(start.bd,end.ud,start.ba,fraction);
            points.ua = rotateFromToAround(start.ua,end.ba,start.ba,fraction);
            points.us = rotateFromToAround(start.us,end.bs,start.bs,fraction);
            points.uw = rotateFromToAround(start.uw,end.ua,start.ba,fraction);
            points.ud = rotateFromToAround(start.ud,end.us,start.bs,fraction);
            break;
        case PLAYERSTATE.ROLLING_S:
            start = generateCubePoints({...cubeData,state:PLAYERSTATE.LAYING_X});
            end = generateCubePoints({...cubeData,state:PLAYERSTATE.LAYING_X,z:cubeData.z+1});
            points.bs = start.bs;
            points.bd = start.bd;
            points.ua = rotateFromToAround(start.ua,end.us,start.bs,fraction);
            points.uw = rotateFromToAround(start.uw,end.ud,start.bd,fraction);
            points.ba = rotateFromToAround(start.ba,end.ua,start.bs,fraction);
            points.bw = rotateFromToAround(start.bw,end.uw,start.bd,fraction);
            points.us = rotateFromToAround(start.us,end.bs,start.bs,fraction);
            points.ud = rotateFromToAround(start.ud,end.bd,start.bd,fraction);
            break;
        case PLAYERSTATE.ROLLING_D:
            start = generateCubePoints({...cubeData,state:PLAYERSTATE.LAYING_Z});
            end = generateCubePoints({...cubeData,state:PLAYERSTATE.LAYING_Z,x:cubeData.x+1});
            points.bd = start.bd;
            points.bw = start.bw;
            points.ud = rotateFromToAround(start.ud,end.bd,start.bd,fraction);
            points.uw = rotateFromToAround(start.uw,end.bw,start.bw,fraction);
            points.bs = rotateFromToAround(start.bs,end.us,start.bd,fraction);
            points.ba = rotateFromToAround(start.ba,end.ua,start.bw,fraction);
            points.us = rotateFromToAround(start.us,end.ud,start.bd,fraction);
            points.ua = rotateFromToAround(start.ua,end.uw,start.bw,fraction);
            break;
    }
    return points;
}
function translatePointToTileGrid(tileX,tileZ,oX,oY) {
    return {
        x: 10*tileZ+30*tileX+oX,
        y: 16*tileZ+-6*tileX+oY
    };
}

// Drawing
function paintScreen() {
    ctx.lineWidth = 1;
    ctx.fillStyle = BACKGROUND_GRADIENT;
    ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
    drawMap(map);
    cube.points = generateCubePoints(cube);
    drawCube();
    //console.log(Object.keys(PLAYERSTATE)[cube.state]);
}
function drawTile(x,y,c=tileType.DEFAULT,full=true) {
    ctx.fillStyle = c[0];
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x+10,y+16);
    ctx.lineTo(x+40,y+10);
    ctx.lineTo(x+30,y-6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = c[1];
    ctx.stroke()
    if (full) {
        ctx.fillStyle = "#404040";
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x,y+5);
        ctx.lineTo(x+10,y+21);
        ctx.lineTo(x+40,y+15);
        ctx.lineTo(x+40,y+10);
        ctx.lineTo(x+10,y+16);
        ctx.fill();
    }
    
}
function drawCube() {
    //drawTileAtTilePos(cube.x,cube.z,tileType.ORANGE,offsetX,offsetY,false);
    ctx.fillStyle = CUBE_COLOR[0];
    ctx.strokeStyle = CUBE_COLOR[1];
    let points = cube.points;

    // Decide order
    let order = "DUFR";
    switch (cube.state) {
        case PLAYERSTATE.FALLING_A:
        case PLAYERSTATE.RISING_D:
            order = "DFBRU";
            break;
        case PLAYERSTATE.FALLING_S:
        case PLAYERSTATE.RISING_W:
            order = "LRFU";
            if (
                (cube.rotationPercent>50 && cube.state == PLAYERSTATE.FALLING_S) ||
                (cube.rotationPercent<50 && cube.state == PLAYERSTATE.RISING_W) ) {
                order = "RLFU";
            }
            break;
        case PLAYERSTATE.ROLLING_A:
            order = "FBUR";
            break;
        case PLAYERSTATE.ROLLING_S:
            order = "LRFU";
            break;
        case PLAYERSTATE.ROLLING_W:
            order = "LUDRF";
            break;
    }

    // Follow order
    for (let i = 0 ; i < order.length ; i++) {
        switch (order[i]) {
            case "D":
                //Draw "Down" side
                ctx.beginPath();
                ctx.moveTo(points.bw.x,points.bw.y);
                ctx.lineTo(points.ba.x,points.ba.y);
                ctx.lineTo(points.bs.x,points.bs.y);
                ctx.lineTo(points.bd.x,points.bd.y);
                ctx.closePath();
                //ctx.fillStyle = "#D0021B"
                ctx.fill();
                ctx.stroke();
                break;
            case "U":
                //Draw "Top" side
                ctx.beginPath();
                ctx.moveTo(points.uw.x,points.uw.y);
                ctx.lineTo(points.ua.x,points.ua.y);
                ctx.lineTo(points.us.x,points.us.y);
                ctx.lineTo(points.ud.x,points.ud.y);
                ctx.closePath();
                //ctx.fillStyle = "#F8E71C"
                ctx.fill();
                ctx.stroke();
                break;
            case "F":
                //Draw "Front" side
                ctx.beginPath();
                ctx.moveTo(points.ba.x,points.ba.y);
                ctx.lineTo(points.bs.x,points.bs.y);
                ctx.lineTo(points.us.x,points.us.y);
                ctx.lineTo(points.ua.x,points.ua.y);
                ctx.closePath();
                //ctx.fillStyle = "#7ED321"
                ctx.fill();
                ctx.stroke();
                break;
            case "B":
                //Draw "Back" side
                ctx.beginPath();
                ctx.moveTo(points.bw.x,points.bw.y);
                ctx.lineTo(points.bd.x,points.bd.y);
                ctx.lineTo(points.ud.x,points.ud.y);
                ctx.lineTo(points.uw.x,points.uw.y);
                ctx.closePath();
                //ctx.fillStyle = "#E48D17";
                ctx.fill();
                ctx.stroke();
                break;
            case "L":
                //Draw "Left" side
                ctx.beginPath();
                ctx.moveTo(points.bw.x,points.bw.y);
                ctx.lineTo(points.ba.x,points.ba.y);
                ctx.lineTo(points.ua.x,points.ua.y);
                ctx.lineTo(points.uw.x,points.uw.y);
                ctx.closePath();
                //ctx.fillStyle = "#F81CDE";
                ctx.fill();
                ctx.stroke();
                break;
            case "R":
                 //Draw "Right" side
                ctx.beginPath();
                ctx.moveTo(points.bs.x,points.bs.y);
                ctx.lineTo(points.bd.x,points.bd.y);
                ctx.lineTo(points.ud.x,points.ud.y);
                ctx.lineTo(points.us.x,points.us.y);
                ctx.closePath();
                //ctx.fillStyle = "#4A90E2"
                ctx.fill();
                ctx.stroke();
                break;
        }
    }   
}
function drawMap(m) {
    rowsToDraw = [[]]
    rowToAdd = [];
    tileX = 0;
    tileZ = 0;
    maxTileX = 0;
    for (let i = 0; i < m.length; i++) {
        if (m[i]=="\n") {
            for (let i = rowToAdd.length-1;i>=0;i--) {
                rowsToDraw[tileZ].push(rowToAdd[i]);
            }
            rowToAdd = [];
            tileX = 0;
            tileZ++;
            rowsToDraw[tileZ] = [];
        }else {
            let toPush = tileX == cube.x-1 && tileZ == cube.z+1 ? [tileX,tileZ,tileType.ORANGE] : [tileX,tileZ,m[i]];
            toPush = [tileX,tileZ,m[i]];
            rowToAdd.push(toPush);
            tileX++;
            if (tileX>maxTileX) maxTileX = tileX;
        }
    }
    for (let i = rowToAdd.length-1;i>=0;i--) {
        rowsToDraw[tileZ].push(rowToAdd[i]);
    }
    let maxX = 10*tileZ+30*maxTileX;
    let maxY = 16*tileZ+-6*maxTileX;
    offsetX = (SCREEN_WIDTH-maxX)/2;
    offsetY = (SCREEN_HEIGHT-maxY)/2;
    loadedMap = []
    for (let i = 0;i<rowsToDraw.length;i++) {
        let row = rowsToDraw[i];
        loadedMap[i] = []
        row.forEach(tile => {
            if (tile[2]!=null) {
                drawTileAtTilePos(tile[0],tile[1],tile[2],offsetX,offsetY);
                loadedMap[tile[1]][tile[0]] = tile[2];
            } 
        }); 
    }
}
function drawTileAtTilePos(tileX,tileZ,tileT,oX,oY,full=true) {
    let point = translatePointToTileGrid(tileX,tileZ,oX,oY);
    drawTile(point.x,point.y,tileT,full);
}

function readFile(path,callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', path, true);  // `true` makes the request asynchronous
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                callback(xhr.responseText);
            } else {
                callback(Error(`HTTP error! status: ${xhr.status}`));
            }
        }
    };
    xhr.send();
}

/*readFile("levels/level1.json",function(e) {
    console.log(JSON.parse(e));
});*/