/// <reference path='headers/GravityGraphData.d.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path='headers/three.d.ts' />
var Cloud = (function (_super) {
    __extends(Cloud, _super);
    function Cloud(link) {
        this.support = link;
        this.velocity = 0;
        this.nbParticles = 10;
        var geometry = new THREE.Geometry();
        for (var i = 0; i < this.nbParticles; i++) {
            geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        }
        _super.call(this, geometry, Cloud.defaultMaterial);
        this.support.setCloud(this);
    }
    Cloud.prototype.changeDefaults = function () {
    };
    Cloud.prototype.update = function () {
        this.position.copy(this.support.geometry.vertices[0]);
        this.lookAt(this.support.geometry.vertices[1]);
    };
    Cloud.prototype.start = function () {
        if (this.velocity < Cloud.baseVelocity) {
            this.velocity += 0.005;
        }
    };
    Cloud.prototype.stop = function () {
        if (this.velocity > 0) {
            this.velocity -= 0.0035;
        }
    };
    Cloud.prototype.animate = function () {
        if (this.velocity > 0) {
            var i = 0, len = this.geometry.vertices.length, vertice, previousVertice;
            var lineLength = this.support.getLineLength();
            while (i < len) {
                vertice = this.geometry.vertices[i];
                vertice.z += this.velocity;
                if (vertice.z > lineLength) {
                    vertice.z = 0;
                }
                if (previousVertice) {
                    if (vertice.z - previousVertice.z < lineLength / this.nbParticles) {
                        vertice.z += this.velocity;
                    }
                }
                previousVertice = vertice;
                i++;
            }
            this.geometry.verticesNeedUpdate = true;
        }
    };
    Cloud.imgMap = 'assets/img/light.png';
    Cloud.particleMap = THREE.ImageUtils.loadTexture(Cloud.imgMap);
    Cloud.defaultMaterial = new THREE.PointCloudMaterial({
        color: 0xffffff,
        size: 5,
        map: Cloud.particleMap,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        //vertexColors: true,
        sizeAttenuation: true
    });
    Cloud.baseVelocity = 0.25;
    return Cloud;
})(THREE.PointCloud);
var Events = (function () {
    function Events() {
        this.eventsMap = {};
    }
    Events.prototype.emit = function (name, args) {
        if (this.eventsMap[name]) {
            this.eventsMap[name].apply(null, args);
        }
    };
    Events.prototype.add = function (name, action) {
        this.eventsMap[name] = action;
    };
    return Events;
})();
/**
* Created by Geoffrey on 5/10/2015.
*/
/// <reference path="headers/Detector.d.ts" />
var EQuality;
(function (EQuality) {
    EQuality[EQuality["LOW"] = 0] = "LOW";
    EQuality[EQuality["MEDIUM"] = 1] = "MEDIUM";
    EQuality[EQuality["HIGH"] = 2] = "HIGH";
})(EQuality || (EQuality = {}));
var Utils = (function () {
    function Utils() {
    }
    Utils.prototype.isNumeric = function (item) {
        return !isNaN(parseFloat(item));
    };
    Utils.prototype.parseBoolean = function (item) {
        var ret = !!item;
        if (item == "true") {
            ret = true;
        }
        else if (item == "false") {
            ret = false;
        }
        return ret;
    };
    return Utils;
})();
var Options = (function () {
    function Options(config) {
        this.U = new Utils();
        this._config = config;
        this.webglAvailable = Detector.webgl;
        if (this.quality > 1 /* MEDIUM */ && !this.isWebGL()) {
            this._config.quality = "medium";
            console.warn("Degraded mode ! (slower)");
            console.warn("WebGL is disabled, your drivers, your DirectX version or your browser are outdated.");
            console.warn("Please update your software.  (https://get.webgl.org/)");
        }
    }
    Object.defineProperty(Options.prototype, "target", {
        get: function () {
            return this._config.target;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Options.prototype, "quality", {
        get: function () {
            var quality = 2 /* HIGH */;
            switch (this._config.quality) {
                case "high":
                    quality = 2 /* HIGH */;
                    break;
                case "medium":
                    quality = 1 /* MEDIUM */;
                    break;
                case "low":
                    quality = 0 /* LOW */;
                    break;
            }
            return quality;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Options.prototype, "opacity", {
        get: function () {
            return parseFloat(this._config.opacity) || 1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Options.prototype, "backgroundColor", {
        get: function () {
            return this._config.backgroundColor || 0x202020;
        },
        enumerable: true,
        configurable: true
    });
    Options.prototype.isTransparent = function () {
        return (this.U.isNumeric(this._config.opacity) && this._config.opacity >= 0 && this._config.opacity < 1);
    };
    Options.prototype.isFlat = function () {
        return this.U.parseBoolean(this._config.flat);
    };
    Object.defineProperty(Options.prototype, "flow", {
        get: function () {
            return this.U.parseBoolean(this._config.flow);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Options.prototype, "stats", {
        get: function () {
            return this.U.parseBoolean(this._config.stats);
        },
        enumerable: true,
        configurable: true
    });
    Options.prototype.isWebGL = function () {
        return this.webglAvailable;
    };
    return Options;
})();
/// <reference path="headers/GravityGraphData.d.ts" />
/// <reference path='headers/d3.d.ts' />
/// <reference path="Events.ts" />
/// <reference path="Utils.ts" />
var D3Wrapper = (function () {
    function D3Wrapper(config, nodes, links) {
        var _this = this;
        if (nodes === void 0) { nodes = []; }
        if (links === void 0) { links = []; }
        this.config = config;
        this.events = new Events();
        this.nodes = nodes;
        this.links = links;
        if (this.config.isFlat()) {
            this.force = d3.layout.force();
        }
        else {
            this.force = d3.layout.force3d();
        }
        this.force.charge(-100).linkDistance(60).size([1000, 1000]).nodes(this.nodes).links(this.links).on('tick', function () {
            _this.tick();
        }).start();
    }
    D3Wrapper.prototype.isWorking = function () {
        return this.working;
    };
    D3Wrapper.prototype.setNodes = function (nodes) {
        if (nodes === void 0) { nodes = []; }
        this.nodes = nodes;
        this.force.nodes(this.nodes);
    };
    D3Wrapper.prototype.setLinks = function (links) {
        if (links === void 0) { links = []; }
        this.links = links;
        this.force.links(this.links);
    };
    D3Wrapper.prototype.on = function (name, action) {
        this.events.add(name, action);
    };
    D3Wrapper.prototype.isStable = function () {
        return this.force.alpha() <= 1e-2;
    };
    D3Wrapper.prototype.isCalm = function () {
        return this.force.alpha() <= 1e-1;
    };
    D3Wrapper.prototype.stabilize = function (limit) {
        if (limit === void 0) { limit = 150; }
        this.idle = true;
        var k = 0;
        while ((!this.isStable()) && (k < limit)) {
            this.force.tick(), k = k + 1;
        }
        this.idle = false;
        this.force.tick();
    };
    D3Wrapper.prototype.calmDown = function () {
        this.stabilize(50);
    };
    D3Wrapper.prototype.shake = function () {
        this.force.start();
    };
    D3Wrapper.prototype.tick = function () {
        this.working = true;
        if (!this.isCalm) {
            this.force.tick();
        }
        else if (!this.idle) {
            this.events.emit("tick", []);
        }
    };
    return D3Wrapper;
})();
/// <reference path='headers/GravityGraphData.d.ts' />
/// <reference path='headers/three.d.ts' />
var Node3D = (function (_super) {
    __extends(Node3D, _super);
    function Node3D(data, config) {
        /*
            var material = ?
            var geometry = ?
        */
        var color = Node3D.nodesColor(data.group);
        var material;
        if (Node3D.materialsMap[color]) {
            material = Node3D.materialsMap[color];
        }
        else if (config.quality == 2 /* HIGH */) {
            material = new THREE.MeshPhongMaterial({
                color: color,
                transparent: true,
                opacity: 0.90,
                wireframe: false,
                shininess: 5
            });
            Node3D.materialsMap[color] = material;
        }
        else if (config.quality < 2 /* HIGH */) {
            material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: false,
                opacity: 0.75,
                wireframe: false
            });
            Node3D.materialsMap[color] = material;
        }
        if (config.quality > 0 /* LOW */) {
            if (config.isWebGL()) {
                _super.call(this, Node3D.basicGeometry, material);
            }
            else {
                _super.call(this, Node3D.degradedGeometry, material);
            }
        }
        else {
            _super.call(this, Node3D.degradedGeometry, material);
        }
        this.data = data;
        this.quality = config.quality;
        this.selected = false;
        this.walked = false;
        this.changeDefaults();
    }
    Node3D.prototype.changeDefaults = function () {
        this.position.set(0, 0, 0);
        this.castShadow = true;
    };
    // COLOR
    Node3D.setColorMethod = function (colorScale) {
        Node3D.nodesColor = colorScale;
    };
    Node3D.prototype.getColor = function () {
        var material = this.material;
        return material.color;
    };
    Node3D.prototype.setColor = function (color) {
        var material = this.material;
        material.color.set(color);
    };
    // DATA
    Node3D.prototype.getData = function () {
        return this.data;
    };
    // REFRESH
    Node3D.prototype.update = function () {
        this.setColor(Node3D.nodesColor(this.data.group));
        this.material.needsUpdate = true;
    };
    Node3D.prototype.updateTarget = function (position) {
        if (this.quality == 0 /* LOW */) {
            this.lookAt(position);
        }
    };
    // UTILS
    Node3D.prototype.distanceTo = function (node) {
        return this.position.distanceTo(node.position);
    };
    Node3D.nodesColor = d3.scale.category10();
    Node3D.basicGeometry = new THREE.IcosahedronGeometry(10, 2);
    Node3D.degradedGeometry = new THREE.IcosahedronGeometry(10, 0);
    //private static lowQualityGeometry : THREE.CircleGeometry = new THREE.CircleGeometry(10, 20);
    Node3D.materialsMap = {};
    return Node3D;
})(THREE.Mesh);
/// <reference path='headers/GravityGraphData.d.ts' />
/// <reference path='headers/three.d.ts' />
var Link3D = (function (_super) {
    __extends(Link3D, _super);
    function Link3D(source, target) {
        this.source = source;
        this.target = target;
        var geometry = new THREE.Geometry();
        geometry.vertices.push(source.position);
        geometry.vertices.push(target.position);
        _super.call(this, geometry, Link3D.defaultMaterial);
        this.changeDefaults();
    }
    Link3D.prototype.changeDefaults = function () {
        this.castShadow = true;
        this.position = this.source.position;
    };
    Link3D.prototype.setCloud = function (c) {
        this.cloud = c;
    };
    Link3D.prototype.getCloud = function () {
        return this.cloud;
    };
    Link3D.prototype.getLineLength = function () {
        return this.lineLength;
    };
    Link3D.prototype.getSource = function () {
        return this.source;
    };
    Link3D.prototype.getTarget = function () {
        return this.target;
    };
    Link3D.prototype.update = function () {
        this.lineLength = this.source.distanceTo(this.target);
        this.geometry.verticesNeedUpdate = true;
        if (this.cloud) {
            this.cloud.update();
        }
    };
    Link3D.defaultMaterial = new THREE.LineBasicMaterial({
        color: 0x909090
    });
    return Link3D;
})(THREE.Line);
/// <reference path='headers/GravityGraphData.d.ts' />
/// <reference path='headers/three.d.ts' />
/// <reference path='headers/tweenjs.d.ts' />
var NodeSelectAnimation = (function (_super) {
    __extends(NodeSelectAnimation, _super);
    function NodeSelectAnimation() {
        var segmentCount = 32, radius = 30, geometry = new THREE.Geometry(), material = new THREE.LineBasicMaterial({
            color: 0xff0000,
            transparent: true
        });
        for (var i = 0; i <= segmentCount; i++) {
            var theta = (i / segmentCount) * Math.PI * 2;
            geometry.vertices.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0));
        }
        _super.call(this, geometry, material);
        this.changeDefaults();
        this.animatedObject = { scale: 0 };
        this.animation = new createjs.Tween(this.animatedObject, {
            loop: true,
        }).to({
            scale: 100
        }, 1000);
    }
    NodeSelectAnimation.prototype.changeDefaults = function () {
        this.scale.set(1, 1, 1);
        this.material.opacity = 1;
    };
    NodeSelectAnimation.prototype.update = function (target) {
        var s = this.animatedObject.scale / 100;
        this.scale.set(s, s, s);
        this.material.opacity = 1 - s;
        this.material.needsUpdate = true;
        this.lookAt(target);
    };
    NodeSelectAnimation.prototype.setPosition = function (position) {
        this.position.copy(position);
    };
    return NodeSelectAnimation;
})(THREE.Line);
/// <reference path="headers/GravityGraphData.d.ts" />
/// <reference path="headers/three.d.ts" />
/// <reference path='headers/three.d.ts' />
/// <reference path='headers/three-orbitcontrols.d.ts' />
/// <reference path='headers/three-projector.d.ts' />
/// <reference path='headers/three-canvasrenderer.d.ts' />
/// <reference path='headers/d3.d.ts' />
/// <reference path='Node3D.ts' />
/// <reference path='Link3D.ts' />
/// <reference path='Cloud.ts' />
/// <reference path='NodeSelectAnimation.ts' />
/// <reference path="D3Wrapper.ts" />
/// <reference path='Events.ts' />
var Visualisation3D = (function () {
    function Visualisation3D(config, d3instance) {
        this.config = config;
        this.d3Instance = d3instance;
        this.events = new Events();
        this.nodes = [];
        this.links = [];
        this.clouds = [];
        this.canvas = document.getElementById(this.config.target);
        this.mouse = {
            x: 0,
            y: 0
        };
        this.lights = new Array();
        var transparentRenderer = this.config.isTransparent();
        if (this.config.isWebGL()) {
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: true,
                alpha: transparentRenderer,
                devicePixelRatio: window.devicePixelRatio
            });
        }
        else {
            var renderer = new THREE.CanvasRenderer({
                canvas: this.canvas,
                antialias: true,
                alpha: transparentRenderer,
                devicePixelRatio: window.devicePixelRatio
            });
            this.renderer = renderer;
        }
        if (!transparentRenderer) {
            this.config.opacity = 1;
        }
        this.renderer.shadowMapEnabled = true;
        this.renderer.shadowMapType = THREE.PCFShadowMap;
        this.renderer.sortObjects = false;
        this.renderer.setClearColor(this.config.backgroundColor, this.config.opacity);
        this.renderer.setSize(this.canvas.width, this.canvas.height);
        this.scene = new THREE.Scene();
        this.nodeSelectAnimation = new NodeSelectAnimation();
        if (this.config.quality == 2 /* HIGH */) {
            this.sphereBackground = this.addBackground();
        }
        this.addCamera();
        this.addLights();
        this.addControls();
        this.addRoot();
        this.bindEvents();
        this.onWindowResize();
        this.listenToD3();
        //this.drawAxis();
    }
    Visualisation3D.prototype.listenToD3 = function () {
        var _this = this;
        var nbTicks = 0;
        this.d3Instance.on("tick", function () {
            // every X ticks
            if (nbTicks % 50 === 0) {
                var i = 0, len = _this.links.length;
                while (i < len) {
                    _this.links[i].geometry.computeBoundingSphere(); // avoid disappearing
                    _this.links[i].update();
                    i++;
                }
            }
            else {
                var i = 0, len = _this.links.length;
                while (i < len) {
                    _this.links[i].update();
                    i++;
                }
            }
            nbTicks++;
            // on stabilisation
            if (_this.d3Instance.isStable()) {
                _this.d3Working = false;
            }
            else {
                _this.d3Working = true;
            }
            // update node selector
            if (_this.selectedNode) {
                _this.nodeSelectAnimation.position.copy(_this.selectedNode.position);
            }
        });
    };
    Visualisation3D.prototype.addCamera = function () {
        this.camera = new THREE.PerspectiveCamera(70, this.canvas.offsetWidth / this.canvas.offsetHeight, 1, 10000);
        this.camera.position.z = 400;
    };
    Visualisation3D.prototype.addRoot = function () {
        var z = (this.config.isFlat() ? 0 : 1000);
        var rootContainerPosition = new THREE.Vector3(1000, 1000, z);
        this.rootObject3D = new THREE.Object3D();
        this.rootObject3D.position.copy(rootContainerPosition).divideScalar(2).negate();
        this.rootObject3D.add(this.nodeSelectAnimation);
        this.scene.add(this.rootObject3D);
    };
    Visualisation3D.prototype.addLights = function () {
        var x, y, z;
        x = 3000;
        y = 3000;
        z = 3000;
        if (this.config.quality != 2 /* HIGH */) {
            this.scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff));
        }
        else {
            this.addLight(x, y, z);
            x = -x;
            this.addLight(x, y, z, true);
            y = -y;
            this.addLight(x, y, z);
            x = -x;
            //this.addLight(x, y, z, false);
            z = -z;
            this.addLight(x, y, z, false);
            y = -y;
            this.addLight(x, y, z, false);
            x = -x;
            this.addLight(x, y, z, false);
        }
    };
    Visualisation3D.prototype.addLight = function (x, y, z, shadows) {
        if (shadows === void 0) { shadows = false; }
        var light = new THREE.SpotLight(0xffffff, 0.6);
        light.position.set(x, y, z);
        light.castShadow = shadows;
        light.shadowCameraNear = 200;
        //if(!this.config.isFlat()){
        var camera = this.camera;
        light.shadowCameraFar = camera.far;
        //}
        light.shadowCameraFov = 50;
        light.shadowBias = -0.00022;
        light.shadowDarkness = 0.5;
        light.shadowMapWidth = 2048;
        light.shadowMapHeight = 2048;
        this.lights.push(light);
        this.scene.add(light);
    };
    Visualisation3D.prototype.addBackground = function () {
        var sphereBackgroundWidth = 20;
        var sphereBackgroundGeo = new THREE.SphereGeometry(sphereBackgroundWidth, sphereBackgroundWidth, sphereBackgroundWidth);
        var sphereBackgroundMat = new THREE.MeshPhongMaterial({
            color: 0xa0a0a0,
            ambient: 0xffffff,
            side: 1,
            transparent: this.config.isTransparent(),
            opacity: this.config.opacity,
            shininess: 100
        });
        var sphereBackground = new THREE.Mesh(sphereBackgroundGeo, sphereBackgroundMat);
        sphereBackground.receiveShadow = true;
        sphereBackground.scale.set(200, 200, 200);
        this.scene.add(sphereBackground);
        return sphereBackground;
    };
    Visualisation3D.prototype.addControls = function () {
        this.controls = new THREE.OrbitControls(this.camera, this.canvas);
        this.controls.rotateSpeed = 1.0;
        this.controls.zoomSpeed = 1.2;
        this.controls.panSpeed = 0.8;
        this.controls.noZoom = false;
        this.controls.noPan = this.config.isFlat();
        this.controls.staticMoving = true;
        this.controls.dynamicDampingFactor = 0.3;
    };
    Visualisation3D.prototype.drawAxis = function () {
        var xMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        var xGeometry = new THREE.Geometry();
        xGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        xGeometry.vertices.push(new THREE.Vector3(10000, 0, 0));
        var xAxis = new THREE.Line(xGeometry, xMaterial);
        var yMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        var yGeometry = new THREE.Geometry();
        yGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        yGeometry.vertices.push(new THREE.Vector3(0, 10000, 0));
        var yAxis = new THREE.Line(yGeometry, yMaterial);
        var zMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
        var zGeometry = new THREE.Geometry();
        zGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        zGeometry.vertices.push(new THREE.Vector3(0, 0, 10000));
        var zAxis = new THREE.Line(zGeometry, zMaterial);
        this.scene.add(xAxis);
        this.scene.add(yAxis);
        this.scene.add(zAxis);
    };
    Visualisation3D.prototype.bindEvents = function () {
        var _this = this;
        window.addEventListener('resize', function (e) {
            _this.onWindowResize();
        }, false);
        this.renderer.domElement.addEventListener('mousemove', function (e) {
            _this.onDocumentMouseMove(e);
        }, false);
        this.renderer.domElement.addEventListener('mousedown', function (e) {
            _this.onDocumentMouseDown(e);
        }, false);
        this.renderer.domElement.addEventListener('mouseup', function (e) {
            _this.onDocumentMouseUp(e);
        }, false);
        this.raycaster = new THREE.Raycaster();
        this.projectionOffset = new THREE.Vector3(0, 0, 0);
        this.intersectPlane = new THREE.Mesh(new THREE.PlaneBufferGeometry(10, 10, 2, 2), new THREE.MeshBasicMaterial({ color: 0x202020, opacity: 0.75, transparent: false }));
        this.intersectPlane.visible = false;
        this.intersectPlane.scale.set(1000, 1000, 1000);
        this.scene.add(this.intersectPlane);
    };
    Visualisation3D.prototype.onWindowResize = function () {
        var newWidth = this.renderer.domElement.parentElement.offsetWidth;
        var newHeight = this.renderer.domElement.parentElement.offsetHeight;
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.canvas.style.width = newWidth + "px";
        this.canvas.style.height = newHeight + "px";
        if (!this.config.isFlat()) {
            var camera = this.camera;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
        }
        this.renderer.setSize(newWidth, newHeight);
    };
    Visualisation3D.prototype.onDocumentMouseMove = function (event) {
        event.preventDefault();
        var boundingRect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - boundingRect.left) / this.canvas.offsetWidth) * 2 - 1;
        this.mouse.y = -((event.clientY - boundingRect.top) / this.canvas.offsetHeight) * 2 + 1;
        if (this.currentlySelectedObject) {
            var intersectPlane = this.getPlanIntersect();
            if (intersectPlane) {
                intersectPlane.point.sub(this.rootObject3D.position);
                this.currentlySelectedObject.position.copy(intersectPlane.point);
                if (this.config.isFlat()) {
                    this.currentlyIntersectedObject.position.z = 0;
                }
                this.update();
            }
            return;
        }
        var intersected = this.getTargetObject();
        if (intersected) {
            if (this.currentlyIntersectedObject != intersected.object) {
                this.currentlyIntersectedObject = intersected.object;
                this.intersectPlane.position.copy(this.currentlyIntersectedObject.position);
                this.intersectPlane.position.add(this.rootObject3D.position);
                this.intersectPlane.lookAt(this.camera.position);
                this.events.emit('nodeOvered', [event, this.currentlyIntersectedObject.getData()]);
            }
            this.canvas.style.cursor = 'pointer';
        }
        else {
            if (this.currentlyIntersectedObject) {
                this.events.emit('nodeBlur', [event]);
            }
            this.currentlyIntersectedObject = null;
            this.canvas.style.cursor = 'auto';
        }
    };
    Visualisation3D.prototype.onDocumentMouseDown = function (event) {
        //event.preventDefault();
        var _this = this;
        if (this.isAClick) {
            this.isAClick = false;
            clearTimeout(this.dragTimout);
        }
        var target = this.getTargetObject();
        if (target) {
            this.currentlySelectedObject = target.object;
            this.isAClick = true;
            this.dragTimout = setTimeout(function () {
                _this.isAClick = false;
                _this.controls.enabled = false;
                _this.getPlanIntersect();
                _this.canvas.style.cursor = 'move';
                _this.d3Instance.shake();
                _this.d3Instance.calmDown();
            }, 150);
        }
    };
    Visualisation3D.prototype.onDocumentMouseUp = function (event) {
        //event.preventDefault();
        this.controls.enabled = true;
        if (this.currentlySelectedObject) {
            if (this.isAClick) {
                clearTimeout(this.dragTimout);
                this.selectNode(this.currentlyIntersectedObject, event);
            }
            else {
                this.d3Instance.shake();
            }
            this.currentlySelectedObject = null;
        }
        this.canvas.style.cursor = 'auto';
    };
    Visualisation3D.prototype.selectNode = function (node, event) {
        if (event) {
            this.events.emit('nodeSelected', [event, node.getData()]);
        }
        if (this.selectedNode) {
            this.unselectNode(this.selectedNode);
        }
        node.selected = true;
        this.selectedNode = node;
        this.nodeSelectAnimation.position.copy(node.position);
    };
    Visualisation3D.prototype.unselectNode = function (node) {
        node.selected = false;
        this.selectedNode = null;
    };
    Visualisation3D.prototype.getPlanIntersect = function () {
        var vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
        vector.unproject(this.camera);
        this.raycaster.set(this.camera.position, vector.sub(this.camera.position).normalize());
        var intersects = this.raycaster.intersectObjects([this.intersectPlane]);
        if (intersects.length > 0) {
            this.projectionOffset.copy(intersects[0].point).sub(this.intersectPlane.position).add(this.rootObject3D.position);
            return intersects[0];
        }
        return null;
    };
    Visualisation3D.prototype.getTargetObject = function () {
        var vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 1);
        vector.unproject(this.camera);
        this.raycaster.set(this.camera.position, vector.sub(this.camera.position).normalize());
        var intersects = this.raycaster.intersectObjects(this.nodes);
        if (intersects.length > 0) {
            return intersects[0];
        }
        else {
            return null;
        }
    };
    // -------------------------------
    Visualisation3D.prototype.start = function () {
        this.d3Instance.shake();
        this.d3Instance.stabilize();
        this.d3Working = false;
    };
    Visualisation3D.prototype.shake = function () {
        this.d3Instance.shake();
    };
    Visualisation3D.prototype.update = function () {
        // clouds
        var i = 0, len = this.clouds.length;
        while (i < len) {
            //debugger;
            if (!this.d3Working) {
                this.clouds[i].start();
                this.clouds[i].update();
            }
            else {
                this.clouds[i].stop();
            }
            this.clouds[i].animate();
            i++;
        }
        // nodes
        i = 0, len = this.nodes.length;
        var target = this.camera.position.clone().sub(this.rootObject3D.position);
        /*if(this.config.quality == EQuality.LOW){
            while(i<len){
                this.nodes[i].lookAt(target);
                i++;
            }
        }
        */
        if (this.selectedNode) {
            this.nodeSelectAnimation.update(target);
        }
    };
    Visualisation3D.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };
    // ----------------------------------------------------
    Visualisation3D.prototype.setNodes = function (nodes) {
        var _this = this;
        this.nodes = [];
        var position = [];
        nodes.forEach(function (node) {
            var n = new Node3D(node, _this.config);
            _this.nodes.push(n);
            _this.rootObject3D.add(n);
            position.push(n.position);
        });
        this.d3Instance.setNodes(position);
    };
    Visualisation3D.prototype.setLinks = function (links) {
        var _this = this;
        if (!this.nodes) {
            throw "setLinks : no nodes founds. You must set nodes before links";
        }
        else {
            this.links = [];
            links.forEach(function (link) {
                var source = _this.nodes[link.source];
                var target = _this.nodes[link.target];
                var link3D = new Link3D(source, target);
                _this.links.push(link3D);
                _this.rootObject3D.add(link3D);
                if (_this.config.flow && _this.config.isWebGL()) {
                    var cloud = new Cloud(link3D);
                    _this.clouds.push(cloud);
                    _this.rootObject3D.add(cloud);
                }
            });
            this.d3Instance.setLinks(links);
        }
    };
    Visualisation3D.prototype.on = function (name, action) {
        this.events.add(name, action);
    };
    return Visualisation3D;
})();
/**
* Created by Geoffrey on 04/04/2015.
*/
/// <reference path='headers/GravityGraphData.d.ts' />
/// <reference path='headers/d3.d.ts' />
/// <reference path='Utils.ts' />
/// <reference path="Visualisation3D.ts" />
/// <reference path="D3Wrapper.ts" />
/// <reference path='Events.ts' />
var U = new Utils();
var GravityGraph = (function () {
    function GravityGraph(config) {
        var _this = this;
        this.config = new Options(config);
        this.canvas = document.getElementById(this.config.target);
        this.events = new Events();
        console.info("GG : Init");
        this.force = new D3Wrapper(this.config);
        this.vis3D = new Visualisation3D(this.config, this.force);
        this.paused = false;
        console.info("Starting main loop.");
        this.initD3();
        if (this.config.stats) {
            this.addStats();
        }
        // bind events
        this.vis3D.on("nodeOvered", function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            _this.events.emit("nodeOvered", args);
        });
        this.vis3D.on("nodeBlur", function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            _this.events.emit("nodeBlur", args);
        });
        this.vis3D.on("nodeSelected", function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            _this.events.emit("nodeSelected", args);
        });
        // ----------------
        this.run();
        /*this.D3Worker.postMessage({
         message : "setNodes",
         type: "array",
         content : positions
         });*/
    }
    /*
     private startD3Worker()  : void{

     this.D3Worker = new Worker('src/worker.js');


     this.D3Worker.onmessage = (event: MessageEvent)=>{
     if(event.data && event.data.message){
     switch (event.data.message){
     case "log":
     console.log("Worker:");
     console.log(event.data.content);
     break;
     case "tick":
     this.updateNodesPositions(event.data.content);
     break;
     default :
     console.log("Worker:");
     console.log(event.data);
     break;
     }
     }
     };

     this.D3Worker.onerror = (event: ErrorEvent)=>{
     console.error(event);
     };
     }*/
    /**
     * Initialise a 3D scene
     */
    GravityGraph.prototype.initD3 = function () {
        // TESTS   --------------------------------------------------------------------------
        var _this = this;
        this.nodes = [];
        this.links = [];
        d3.json("data-test/miserables.json", function (error, graph) {
            if (error) {
                console.error(error);
            }
            else {
                _this.vis3D.setNodes(graph.nodes);
                _this.vis3D.setLinks(graph.links);
                _this.vis3D.start();
            }
        });
    };
    GravityGraph.prototype.run = function (time) {
        var _this = this;
        if (this.stats) {
            this.stats.begin();
        }
        if (!this.paused) {
            this.update();
            //TWEEN.update(time);
            this.render();
            requestAnimationFrame(function () {
                _this.run();
            });
        }
        if (this.stats) {
            this.stats.end();
        }
    };
    GravityGraph.prototype.pause = function () {
        this.paused = true;
    };
    GravityGraph.prototype.resume = function () {
        this.paused = false;
    };
    GravityGraph.prototype.update = function () {
        this.vis3D.update();
    };
    GravityGraph.prototype.render = function () {
        this.vis3D.render();
    };
    // D3
    /*
     private updateNodesPositions(positions : Array<INodeData>   ){

     var node_index = this.nodes.length-1;
     var positions_index = positions.length-1;

     while(node_index >= 0 && positions_index >= 0){
     var n = this.nodes[node_index];
     var pos = positions[positions_index];
     n.position.x = pos.x;
     n.position.y = pos.y;
     n.position.z = pos.z;

     node_index--;
     positions_index--;
     }

     }
     */
    // UTILS
    GravityGraph.prototype.addStats = function () {
        var stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = this.canvas.offsetLeft + "px";
        stats.domElement.style.top = this.canvas.offsetTop + "px";
        this.canvas.parentElement.appendChild(stats.domElement);
        this.stats = stats;
    };
    // events
    GravityGraph.prototype.on = function (name, action) {
        this.events.add(name, action);
    };
    return GravityGraph;
})();
/**
 * Created by Geoffrey on 04/04/2015.
 */
/// <reference path='headers/d3.d.ts' />
/// <reference path='headers/GravityGraphData.d.ts' />
/*

importScripts("../vendors/d3.js");



class D3Worker{


    private worker : IWorker;


    private force : D3.Layout.ForceLayout;

    private nodes : Array<INodeData>;

    private links : Array<ILinkData>;


    constructor( worker : IWorker ){
        this.worker = worker;


        this.worker.onmessage = (event : MessageEvent)=>{
            switch (event.data.message){
                case "setNodes" :
                    this.nodes = event.data.content;
                    this.force.nodes(this.nodes);
                    this.skipEnter();
                    break;
                case "setLinks" :
                    this.links = event.data.content;
                    this.run();
                    break;
                default :
                    break;
            }
        }

        this.init();

        this.run();
        this.worker.postMessage({
            message : "log",
            type: "string",
            content: "D3 Worker ready"
        });
    }


    private init(){
        this.force = d3.layout.force();

        this.force
            .charge(-100)
            .linkDistance(60)
            .size([100,100])
            .on('tick', ()=>{
                this.tick();
            });



    }



    private run() : void {
        if(this.nodes != undefined){
            this.force.start();
        }
    }

    private skipEnter(): void {
        this.run();
        var i = 0;
        while(this.force.alpha() > 1e-2 ){
            this.force.tick();
            i++;
        }

        this.force.stop();
    }


    private tick(){
        this.worker.postMessage({
            message : "tick",
            type: "array",
            content : this.nodes
        });
    }
}

// START


((self: IWorker) => {

    new D3Worker(self);
})(<any>self);

*/
//# sourceMappingURL=GravityGraph.js.map