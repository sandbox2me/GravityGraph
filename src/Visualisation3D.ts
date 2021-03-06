/// <reference path="headers/three" />
/// <reference path="headers/three-orbitcontrols" />
/// <reference path="headers/three-canvasrenderer" />
/// <reference path="NodeSelectAnimation" />
/// <reference path="Foci" />


module GravityGraph{
    
    
    export class Visualisation3D {
    	
        private config : Config;
    	
    	private canvas:HTMLCanvasElement;
    
        private mouse:IMouse;
        private scene:THREE.Scene;
        private renderer:THREE.WebGLRenderer;
        private camera:THREE.Camera;
        private lastCameraPosition : THREE.Vector3; private zeroVect = new THREE.Vector3();
    
        private controls:THREE.OrbitControls;
    
        private sphereBackground:THREE.Mesh;
    
        private lights:Array<THREE.Light>;
        private rootObject3D:THREE.Object3D;
    
        private nodes:Array<Node3D>;
        private links:Array<Link3D>;
    
        private clouds: Array<Cloud>;
        
        private foci : Foci;
        private useFoci : boolean;
        
        
        private selectedNode : Node3D;
        private nodeSelectAnimation : NodeSelectAnimation;
        
        private d3Instance : D3Wrapper;
        private d3Working : boolean;
        
        // events
        
        private events : Events;
        
        // utils
        private U : Utils;
        
        
    	constructor(config : Config, d3instance : D3Wrapper){
            
            this.config = config;
            
            this.U = new Utils();
            
            this.d3Instance = d3instance;
            
            this.events = new Events();
            
            this.useFoci = false;
            
            
            this.nodes = [];
            this.links = [];
            this.clouds = [];
            
            
            this.canvas = <HTMLCanvasElement> document.getElementById(this.config.target);
            this.mouse = {
                x: 0,
                y: 0
            };
    
            this.lights = new Array();      
    
    
            var transparentRenderer = this.config.isTransparent();
            
            if(this.config.isWebGL()){
                this.renderer = new THREE.WebGLRenderer({
                    canvas: this.canvas,
                    antialias: this.config.quality > EQuality.LOW,
                    alpha: transparentRenderer,
                    devicePixelRatio: window.devicePixelRatio
                });
            }
            else{
                var renderer = new THREE.CanvasRenderer({
                    canvas: this.canvas,
                    antialias: false,
                    alpha: false,
                    devicePixelRatio: window.devicePixelRatio
                });
                
                this.renderer = <any> renderer;
            }
            
    
            if(!transparentRenderer){
                this.config.opacity = 1;
            }
    
            
            this.renderer.shadowMapEnabled = this.config.shadows;
            this.renderer.shadowMapType = THREE.PCFShadowMap;
            this.renderer.shadowMapDebug = false;
            this.renderer.sortObjects = false;
            
    
    
            this.renderer.setClearColor(
                this.config.backgroundColor,
                this.config.opacity
            );
    
            this.renderer.setSize(
                this.canvas.width,
                this.canvas.height
            );
    
    
            this.scene = new THREE.Scene();
    
            this.nodeSelectAnimation = new NodeSelectAnimation();
            
            
    
            if(this.config.quality == EQuality.HIGH){
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
        
        
        
        private listenToD3(){
            
            
            this.d3Instance.on("tick", (alpha)=>{
                
                
                if(this.useFoci){
                    var k = 0.1 * alpha;
                    
                    var i = 0, len = this.nodes.length, node: Node3D;
                    while(i < len){
                        node = this.nodes[i];
                        var x = (node.position.x || 0); 
                        //console.log(x);
                            x += (this.foci.getPositionOf(node.getData().group).x - x) * k; 
                        var y = (node.position.y || 0); 
                            y += (this.foci.getPositionOf(node.getData().group).y - y) * k;
                        
                        node.position.set(x,y,node.position.z);  
                        
                        i++;
                    }
                }
                
                var i = 0, len = this.links.length;
                while (i < len) {
                    this.links[i].update();
                    i++;
                }
                
                // on stabilisation
                if(this.d3Instance.isStable()){
                    this.d3Working = false;
                }
                else{
                    this.d3Working = true;
                }
                
                // update node selector
                if(this.selectedNode){
                    this.nodeSelectAnimation.position.copy(this.selectedNode.position);
                }
                
            });
            
        }
        
        public separateGroups(separate : boolean = false){
            this.useFoci = separate;
        }
        
        
        
        private addCamera(){
    
           this.camera = new THREE.PerspectiveCamera(
                70,
                this.canvas.offsetWidth / this.canvas.offsetHeight,
                1,
                8000
           );
    
           this.camera.position.z = 1000;
    
        }
        
        private addRoot(){
    
    
            var z =  (this.config.isFlat() ? 0 : 0);
    
            var rootContainerPosition = new THREE.Vector3(0, 0, z);
    
            this.rootObject3D = new THREE.Object3D();
            this.rootObject3D.position.copy(rootContainerPosition).divideScalar(2).negate();
    
            this.rootObject3D.add(this.nodeSelectAnimation);
            this.scene.add(this.rootObject3D);
        }
        
        private addLights():void {
            var x, y, z;
    
            x = 3000;
            y = 3000;
            z = 3000;
            
            if(this.config.quality < EQuality.HIGH){
                this.scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff));                
            }
            else{                
                this.addLight(x, y, z );
    
                x = -x;
                this.addLight(x, y, z , this.config.shadows );
    
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
    
    
    
        }
    
        private addLight(x:number, y:number, z:number, shadows = false) {
    
            var light:THREE.SpotLight = new THREE.SpotLight(0xffffff, 0.6);
    
            light.position.set(x, y, z);
            light.castShadow = shadows;
    
            light.shadowCameraNear = 200;
            //if(!this.config.isFlat()){
                var camera = <THREE.PerspectiveCamera> this.camera;
                
                light.shadowCameraFar = camera.far*2;
            //}
            light.shadowCameraFov = 50;
    
            light.shadowBias = -0.00022;
            light.shadowDarkness = 0.5;
    
            light.shadowMapWidth = 2048;
            light.shadowMapHeight = 2048;
    
            this.lights.push(light);
            this.scene.add(light);
        }
    
        public addBackground(): THREE.Mesh {
    
    
            var sphereBackgroundWidth = 20;
            var sphereBackgroundGeo = new THREE.SphereGeometry(sphereBackgroundWidth, sphereBackgroundWidth, sphereBackgroundWidth);
            
            var sphereBackgroundMat = new THREE.MeshLambertMaterial({
                color: 0xa0a0a0,//0x404040,
                ambient: 0xffffff,
                side: 1,
                transparent: this.config.isTransparent(),
                opacity : this.config.opacity,
                
            });
            var sphereBackground = new THREE.Mesh(sphereBackgroundGeo, sphereBackgroundMat);
    
            sphereBackground.receiveShadow = true; // this.config.shadows;
            sphereBackground.scale.set(200, 200, 200);
    
            this.scene.add(sphereBackground);
            return sphereBackground;
        }
    
        private addControls(){
            this.controls = new THREE.OrbitControls(this.camera, this.canvas);
            this.controls.rotateSpeed = 1.0;
            this.controls.zoomSpeed = 1.2;
            (<any> this.controls).panSpeed = 0.8;
            this.controls.noZoom = false;
            this.controls.noPan = false; //this.config.isFlat();

            ( <any> this.controls).staticMoving = true;
            ( <any> this.controls).dynamicDampingFactor = 0.3;

            if(this.config.isFlat()){
                this.controls.noRotate = true;
            }

            this.controls.noKeys = true;
        }
    
        private drawAxis():void {
    
            var xMaterial = new THREE.LineBasicMaterial({color: 0xff0000});
            var xGeometry = new THREE.Geometry();
            xGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
            xGeometry.vertices.push(new THREE.Vector3(10000, 0, 0));
    
            var xAxis = new THREE.Line(xGeometry, xMaterial);
    
    
            var yMaterial = new THREE.LineBasicMaterial({color: 0x00ff00});
            var yGeometry = new THREE.Geometry();
            yGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
            yGeometry.vertices.push(new THREE.Vector3(0, 10000, 0));
    
            var yAxis = new THREE.Line(yGeometry, yMaterial);
    
    
            var zMaterial = new THREE.LineBasicMaterial({color: 0x0000ff});
            var zGeometry = new THREE.Geometry();
            zGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
            zGeometry.vertices.push(new THREE.Vector3(0, 0, 10000));
    
            var zAxis = new THREE.Line(zGeometry, zMaterial);
    
    
            this.scene.add(xAxis);
            this.scene.add(yAxis);
            this.scene.add(zAxis);
        }
        
        
        
        
        
        
        //------------------------------
        
        
        
        // EVENTS
    
        private raycaster : THREE.Raycaster;
    
        private projectionOffset : THREE.Vector3;
    
        private intersectPlane : THREE.Mesh;
        private currentlySelectedObject : Node3D;
        private currentlyIntersectedObject : Node3D;
    
        private bindEvents(){
    
            window.addEventListener( 'resize', (e : Event) => {
                this.onWindowResize();
            }, false );
    
            this.renderer.domElement.addEventListener( 'mousemove', (e:MouseEvent)=>{
                this.onDocumentMouseMove(e);
            }, false );
            this.renderer.domElement.addEventListener( 'mousedown', (e:MouseEvent)=>{
                this.onDocumentMouseDown(e);
            }, false );
            this.renderer.domElement.addEventListener( 'mouseup', (e:MouseEvent)=>{
                this.onDocumentMouseUp(e);
            }, false );
            
            this.renderer.domElement.addEventListener( 'dblclick', (e:MouseEvent)=>{
                this.events.emit("dblclick", []);
            }, false );
            
            this.renderer.domElement.addEventListener( 'contextmenu', (e:MouseEvent)=>{
                this.events.emit("contextmenu", []);
            }, false );
            
    
            this.raycaster = new THREE.Raycaster();
            this.projectionOffset = new THREE.Vector3(0,0,0);
    
    
            this.intersectPlane = new THREE.Mesh(
                new THREE.PlaneBufferGeometry( 10, 10, 2, 2 ),
                new THREE.MeshBasicMaterial( { color: 0x202020, opacity: 0.75, transparent: false } )
            );
            this.intersectPlane.visible = false;
            this.intersectPlane.receiveShadow = true;        
            this.intersectPlane.scale.set(1000,1000,1000);
            
            this.scene.add( this.intersectPlane );
    
    
    
        }
    
        private onWindowResize(){
    
            var newWidth = this.renderer.domElement.parentElement.offsetWidth;
            var newHeight = this.renderer.domElement.parentElement.offsetHeight;
            
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
            this.canvas.style.width = newWidth + "px";
            this.canvas.style.height = newHeight + "px";
    
            
            var camera = <THREE.PerspectiveCamera> this.camera;
            camera.aspect = newWidth/ newHeight;
            camera.updateProjectionMatrix();            
    
    
            this.renderer.setSize( newWidth, newHeight);
        }
        
        private onDocumentMouseMove(event : MouseEvent){
    
            event.preventDefault();
            
            var boundingRect : ClientRect = this.canvas.getBoundingClientRect();
    
            this.mouse.x = ( (event.clientX - boundingRect.left)  / this.canvas.offsetWidth ) * 2 - 1;
            this.mouse.y = - ( (event.clientY - boundingRect.top) / this.canvas.offsetHeight ) * 2 + 1;
    
    
    
            if ( this.currentlySelectedObject ) {
    
                var intersectPlane = this.getPlanIntersect();
                if(intersectPlane){
                    intersectPlane.point.sub(this.rootObject3D.position);
                    this.currentlySelectedObject.position.copy(intersectPlane.point);
                    if(this.config.isFlat()){
                        this.currentlyIntersectedObject.position.z = 0;
                    }
                    this.update();
                }
                return;
            }
    
            var intersected = this.getTargetObject();
    
            if ( intersected ) {
    
                if ( this.currentlyIntersectedObject != intersected.object ) {
    
    
                    this.currentlyIntersectedObject = <Node3D> intersected.object;
    
                    this.intersectPlane.position.copy( this.currentlyIntersectedObject.position  );
                    this.intersectPlane.position.add(this.rootObject3D.position);
                    this.intersectPlane.lookAt( this.camera.position );
    
                    this.events.emit('nodeOvered', [event, this.currentlyIntersectedObject.getData()]);
    
                }
    
                this.canvas.style.cursor = 'pointer';
                
                
    
            } else {
    
                if(this.currentlyIntersectedObject){
                    this.events.emit('nodeBlur', [event]);
                }
    
                this.currentlyIntersectedObject = null;
                this.canvas.style.cursor = 'auto';
    
            }
        }
    
        
        private isAClick : boolean;
        private dragTimout : number;
    
        private onDocumentMouseDown(event : MouseEvent){
    
            //event.preventDefault();
    
            if(this.isAClick){
                this.isAClick = false;
                clearTimeout(this.dragTimout);
            }
            
            
                var target = this.getTargetObject();
        
                if ( target ) {
                    
                    this.currentlySelectedObject =  target.object;
                    
                    this.isAClick = true;
                    this.dragTimout = setTimeout(()=>{
                        
                        this.isAClick = false;
                        
                        this.controls.enabled = false;
                        this.getPlanIntersect();
        
                        this.canvas.style.cursor = 'move';
        
                        if(this.d3Instance.isStable()){
                            this.d3Instance.shake();
                            //this.d3Instance.calmDown();
                        }
                        
                    }, 150);
               }
               else{
                   //this.unselectNode(this.selectedNode);
               }         
            
        }
    
        private onDocumentMouseUp(event : MouseEvent){
            //event.preventDefault();
    
            this.controls.enabled = true;
    
            if ( this.currentlySelectedObject) {
                
                if(this.isAClick){
                    clearTimeout(this.dragTimout);
                    this.selectNode(this.currentlyIntersectedObject, event);
                }
                else{
                    if(this.d3Instance.isStable()){
                        this.d3Instance.shake();
                        //this.d3Instance.calmDown();                  
                    }
                }            
                
                this.currentlySelectedObject = null;
                
                
                /*
                this.intersectPlane.position
    
                    .copy( this.currentlyIntersectedObject.position )
                    .add(this.rootObject3D.position);
                */            
            }
    
            this.canvas.style.cursor = 'auto';
        }
        
        
        
        public selectNode( node : Node3D, event? : MouseEvent ) : void {
            
            
            //if(event){
                this.events.emit('nodeSelected', [event, node.getData()]);
            //}
            
            if(this.selectedNode){
                this.unselectNode(this.selectedNode);
            }
    
            node.selected = true;
            this.selectedNode = node;
            
            this.nodeSelectAnimation.setPosition(node);
            this.nodeSelectAnimation.show();
            this.nodeSelectAnimation.animate();
            
        }
        
        public unselectNode( node = this.selectedNode ) : void {
            if(node){
                node.selected = false;
                this.selectedNode = null;
                this.nodeSelectAnimation.hide();
                
            }
        }
        
        
        
    
        private getPlanIntersect(): any {
    
    
            var vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
    
            vector.unproject(this.camera);
    
            this.raycaster.set(this.camera.position, vector.sub(this.camera.position).normalize());
    
            var intersects = this.raycaster.intersectObjects([this.intersectPlane]);
    
            if (intersects.length > 0) {
                this.projectionOffset
                    .copy(intersects[0].point)
                    .sub(this.intersectPlane.position)
                    .add(this.rootObject3D.position);
                return intersects[0];
            }
            return null;
        }
    
        private getTargetObject(): any {
            var vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 1);
    
            vector.unproject(this.camera);
    
            this.raycaster.set(this.camera.position, vector.sub(this.camera.position).normalize());
    
            var intersects = this.raycaster.intersectObjects(this.nodes);
            if (intersects.length>0) {
                return intersects[0];
            }
            else{
                return null;
            }
        }
        
        
        
        
        
        
        // -------------------------------
        
        public start(){
            this.d3Instance.shake();
            this.d3Instance.stabilize();
            
            this.d3Working = false;
        }
        
        public shake(){
            this.d3Instance.shake();
        }
        
        
        
        private nbUpdate = 0;
        public update(){
            
            this.nbUpdate ++;
            
            //camera
            if(this.lastCameraPosition == undefined){
                this.lastCameraPosition = this.camera.position.clone();
            }
            else if(this.camera.position.distanceTo(this.zeroVect) > 4100){
                this.camera.position.copy(this.lastCameraPosition);
            }
            else {
                this.lastCameraPosition.copy(this.camera.position);
            }
            
            
            var i, len;
            
            // clouds
            
            i = 0, len = this.clouds.length;
            if(this.nbUpdate % 2 == 0){
                while (i < len) {
                    //debugger;
                    if(!this.d3Working){
                        this.clouds[i].start();
                        this.clouds[i].update();
                    }
                    else{
                        this.clouds[i].stop();
                    }
                    
                    this.clouds[i].animate();            
                    i++;
                }
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
            
            if(this.nbUpdate % 20 == 0){
                i = 0, len = this.links.length;
                var link : Link3D;
                while(i<len){
                    link = this.links[i];
                    link.geometry.computeBoundingBox();
                    i++;
                }
                
            }
            
            if(this.selectedNode){
                this.nodeSelectAnimation.update(target);
            }
            
        }
        
        public render():void {
            this.renderer.render(this.scene, this.camera);
        }
    
    
    
    
        // ----------------------------------------------------
        
        public setForce(force : D3Wrapper){
            this.d3Instance = force;
        }
        
        public setNodes( nodes : Array<any> ){

            this.config.resetColorBuilder();
            Node3D.resetColorMethod();
            
            this.nodes.forEach((n)=>{
               this.rootObject3D.remove(n); 
            });
            this.links.forEach((l)=>{
               this.rootObject3D.remove(l); 
            });
            
            this.nodes = [];
            this.foci = new Foci();
            
            var position = [];
            
            var flattened = nodes;
            
            
            
            if(this.U.isObject(nodes)){
                
                flattened = [];
                for (var name in nodes) {
                    if (nodes.hasOwnProperty(name)) {
                        flattened.push(nodes[name]);                    
                    }
                }
            }        
            
            
            
            flattened.forEach((node, i)=> {
                node.id = i;
                var n = new Node3D(node, this.config);
                this.nodes.push(n);
                this.rootObject3D.add(n);
                position.push(n.position);
                this.foci.addFocus(node.group);
            });
                 
            this.d3Instance.setNodes(position);
            this.setLinks([]);
            
            this.listenToD3();
            
            return this.nodes;
        }
        
        
        public setLinks(links : Array<any>){       
            
            if(!this.nodes){
                throw "GG: setLinks() : no nodes founds. You must set nodes before links";
            }
            else{
                
                for (var i = 0; i < this.links.length; i++) {
                    var l = this.links[i];
                    this.rootObject3D.remove(l.getCloud());
                    this.rootObject3D.remove(l);
                }
                
                this.links = [];
                this.clouds = [];
                this.d3Instance.setLinks([]);
                
                var filteredLinks = [];
                
                for (var j = 0; j < links.length; j++) {
                    var link = links[j];

                    
                    if(typeof link.source === "string"){
                        link.source = this.indexOf(link.source);
                    }
                    if(typeof link.target === "string"){
                        link.target = this.indexOf(link.target);
                    }
                    
                    var source = this.nodes[link.source];
                    var target = this.nodes[link.target];
                    
                    if(source && target && source != target ){
                        
                        filteredLinks.push(link);
                        var link3D = new Link3D(source, target, link, this.config);
                        
                        this.links.push(link3D);
            
                        if(this.config.flow && this.config.isWebGL() && this.config.quality > EQuality.LOW){
                            var cloud = new Cloud(link3D);
                            this.clouds.push(cloud);
                            this.rootObject3D.add(cloud);
                        }                    
                        
                        this.rootObject3D.add(link3D);
                    }
                    else{
                        this.events.emit('warn', [
                            "Bad link : " + link.source + "->" + link.target + "  =  " + source + "->" + target
                        ]);
                    }
                    
                }
                
                this.d3Instance.setLinks(filteredLinks);
                
                return this.links;
            }
        }
        
        
        
        private indexOf(name : string) : number {
            var foundAt = 0, node;
            
            for (var i = 0; i < this.nodes.length; i++) {
                node = this.nodes[i].getData();
                if(node.name == name){
                    foundAt = i;
                    break;
                }
            }
            
            
            return foundAt;
        }
        
        
        public on (name : string, action : Function) : void {
            this.events.add(name, action);
        }
        
        
        
        
        //  GETTERS / SETTERS
        
        
        public getSelectedNode() : Node3D {
            return this.selectedNode;
        }
        
        public isOverSomething() : boolean{
            return !!this.getTargetObject();
        }
        
        
    
    }
    
}