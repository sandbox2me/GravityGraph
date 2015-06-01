/**
* Created by Geoffrey on 04/04/2015.
*/



module GravityGraph{
    
    "use strict";
    
    declare var Stats;
    declare var TWEEN ;
    
    export enum ERelation{
        INNER,
        OUTER,
        INNER_OUTER,
        SELF
    }
    
    var U = new Utils();
    
    export class Graph {
        
        
    
        private config: Config;
        
        private canvas:HTMLCanvasElement;
    
        private paused:boolean;
        
        
        // 3D
        
        private vis3D : Visualisation3D;
        
        // D3
        private force: D3Wrapper;
        
        // Stats
        
        private stats;
        
        
        // User functions
        
        private events : Events;
        
        
        
        // Data
        
        private nodes : Array<Node3D>;
        private links : Array<Link3D>;
        
        
        
    
        constructor(config:IConfig) {
    
            this.config = new Config(config);
            this.canvas = <HTMLCanvasElement> document.getElementById(this.config.target);
            this.events = new Events();
            
    
            console.info("GG : Init");
            
            this.force = new D3Wrapper(this.config);
            this.vis3D = new Visualisation3D(this.config, this.force);
    
            this.paused = false;
    
            console.info("Starting main loop.");
    
            
            if(this.config.stats){
                this.addStats();
            }
            
            // bind events
            
            
            this.vis3D.on("nodeOvered", (...args)=>{
                this.events.emit("nodeOvered", args);
            });
            
            this.vis3D.on("nodeBlur", (...args)=>{
                this.events.emit("nodeBlur", args);
            });
            
            this.vis3D.on("nodeSelected", (...args)=>{
                this.events.emit("nodeSelected", args);
            });
            
            this.vis3D.on("dblclick", ()=>{
                if (!this.vis3D.isOverSomething()){
                    this.resetFocus();
                }
                else{
                    this.focusOnRelations();                
                }
            });
            
            this.vis3D.on("contextmenu", ()=>{
                //this.resetFocus();
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
           
    
        public setNodes(nodes : Array<INodeData>){
            
            var clone = JSON.parse(JSON.stringify(nodes));
            
            this.force = new D3Wrapper(this.config);
            this.vis3D.setForce(this.force);
            
            this.nodes = this.vis3D.setNodes(clone);
        }
        
        public setLinks(links : Array<ILinkData>){
            var clone = JSON.parse(JSON.stringify(links));
            clone = this.groupLinks(clone);
            console.log(clone);
            this.links = this.vis3D.setLinks(clone);
        }
        
        
        private groupLinks(links : Array<ILinkData>) : Array<ILinkData> {
            var grouped : Array<ILinkData> = [];
            var map : {[index : string] : ILinkData} = {};
            
            var key;
            for (var i = 0; i < links.length; i++) {
                var link = links[i];
                link.value = link.value || 0;
                
                key = link.source + ":" + link.target;
                
                if(!map[key]){
                    map[key] = link;
                }
                else{
                    map[key].value += link.value;
                }
            }
            
            for (var key in map) {
                if (map.hasOwnProperty(key)) {
                    var element = map[key];
                    grouped.push(element);
                }
            }
            
            return grouped;
        }
        
        
        // main loop  
        
        private run( time? ):void {
            
            if(this.stats){
                this.stats.begin();
            }
                
            if (!this.paused) {
                this.update();
                //TWEEN.update(time);
                this.render();
                requestAnimationFrame(()=> {
                    this.run();
                });
            }
            
            if(this.stats){
                this.stats.end();
            }
            
        }
        
        
    
        private update():void {
            this.vis3D.update();            
        }
    
        private render():void {
            this.vis3D.render();
        }
        
        
        // controls
        
        
        public start(){
            this.vis3D.start();
        }
    
        public pause():void {
            this.paused = true;
        }
    
        public resume():void {
            this.paused = false;
        }
        
        
        // setters
        
        
    
        public setCharge(charge : number){
            this.force.setCharge(charge);
        }
        
        public setDistance(distance : number){
            this.force.setDistance(distance);
        }
        
        
        
        
        
    
    
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
    
        
    
    
    
        
        
        
        
        
        private addStats(){
            var stats = new Stats();
            
            stats.setMode(0);
            
            stats.domElement.style.position = 'absolute';
            stats.domElement.style.left = (this.canvas.offsetLeft + 5) + "px";
            stats.domElement.style.top = (this.canvas.offsetTop + 5) + "px";
            
            this.canvas.parentElement.appendChild(stats.domElement);
            
            this.stats = stats;            
        }
        
        
        
        
        
        // events
        
        
        
        public on (name : string, action : Function) : void {
            this.events.add(name, action);
        }
        
        
        
        
        
        //  --  Advenced methods  --
        
        
        
        public selectBy(idkey : string, value : any) : void {
            for (var i = 0; i < this.nodes.length; i++) {
                var node = this.nodes[i];
                if(node.getData()[idkey] === value){
                    this.vis3D.selectNode(node);
                    break;
                }
            }
        }
        
        public unSelect() : void {
            this.vis3D.unselectNode();
        }
        
    
        private resetFocus(){
            this.nodes.forEach((node) => {
                node.setFocused();
            });
            if(this.links){
                this.links.forEach((link) => {
                    link.setFocused();
                    link.getText().setUnFocused();
                });
            }
        }
        
        public focusOnRelations(nodes ? : Array<Node3D>, type : ERelation = ERelation.SELF){
            var relations : IGraph = {
                nodes : [],
                links : []
            };
            
            var nodeOfGroup : Node3D;   // a node of the focused group for coparision with other nodes 
            
            if( type == ERelation.SELF && this.vis3D.getSelectedNode()){
                nodeOfGroup = this.vis3D.getSelectedNode();
                relations = this.getRelationsOf(this.vis3D.getSelectedNode());
            }
            else if (nodes){
                nodeOfGroup = nodes[0];
                nodes.forEach((node)=>{
                    var rel = this.getRelationsOf(node);
                    relations.nodes = relations.nodes.concat(rel.nodes);
                    relations.links = relations.links.concat(rel.links);
                });
            }
            
            
            
            if(relations.nodes){            
                
                this.nodes.forEach((node)=>{
                   if(relations.nodes.indexOf(node) != -1){
                       node.setFocused();
                   }
                   else{
                       node.setUnFocused();
                   }
                });
                this.links.forEach((link)=>{
                   if(relations.links.indexOf(link) != -1 ){  // if link is candidate
                       
                       
                       
                       
                       if(type == ERelation.SELF || type == ERelation.INNER_OUTER){
                           link.setFocused();
                           link.getText().setFocused();
                       }
                       else if(type == ERelation.OUTER && !link.getTarget().isSameGroupOf(link.getSource())){
                            link.setFocused();
                            link.getText().setFocused();    
                       }
                       else if(type == ERelation.INNER && link.getTarget().isSameGroupOf(link.getSource()) ){
                           link.setFocused();
                           link.getText().setFocused();
                       }
                       else{
                            link.setUnFocused();
                            link.getText().setUnFocused();
                       }
                       
                            
                   }
                   else{
                       link.setUnFocused();
                       link.getText().setUnFocused();
                   }
                });
            }
        }
        
        public focusOnGroupRelations(relationType : ERelation = ERelation.INNER){
            var nodes : Array<Node3D> = [];
            
            if(this.vis3D.getSelectedNode()){
                            
               this.nodes.forEach((node) => {
                   if(node.isSameGroupOf(this.vis3D.getSelectedNode())){
                       node.setFocused();
                       nodes.push(node);
                   }
                   else{
                       node.setUnFocused();
                   }
               });
               
               if(nodes){
                   this.focusOnRelations(nodes, relationType);
               }
            }
            
        }
        
        
        public separateGroups(separate : boolean = false){
            this.vis3D.separateGroups(separate);
            this.force.shake();
        }
        
        
        public shake(){
            this.vis3D.separateGroups(false);
            this.force.shakeHard();
        }
        
        
        // SEARCH / SORT
        
        private getRelationsOf(node:Node3D) : IGraph  {
            var name = this.getNameOrIndexOf(node);
            
            
            var relations : IGraph = {
                nodes : [],
                links : []
            };
            
            if(name !== undefined ){
                this.links.forEach((link) => {
                    
                    
                    var match = false;
                    
                    if(link.getData().source == name || link.getData().target == name){
                    
                        var node = this.nodes[link.getData().source];
                        if(relations.nodes.indexOf(node) == -1 && node){
                            relations.nodes.push(node);
                        }
                        node = this.nodes[link.getData().target];
                        if(relations.nodes.indexOf(node) == -1 && node){
                            relations.nodes.push(node);
                        }
                        
                        relations.links.push(link);
                        
                    }             
                    
                });
            }
            
            return relations;        
        }
        
        private getNameOrIndexOf(node:Node3D){
            
            var name;
            
            for (var i = 0; i < this.links.length; i++) {
                var link = this.links[i];
                
                var source = link.getData().source;
                var target = link.getData().target;
                
                if(this.nodes[source] && this.nodes[source].equals(node)){
                    name = source;
                    break;   
                }
                else if(this.nodes[target] && this.nodes[target].equals(node)){
                    name = target;
                    break;
                }
            }
            
            return name;
            
        }
        
        
    }





    // Global definitions


    export interface IGraph {
        nodes : Array<Node3D>;
        links : Array<Link3D>;
    }
    
    export interface IPoint{
        x : number;
        y : number;
    }
    
    export interface IMouse extends IPoint{}
    
    
    
    export interface IConfig{
        target : string;
        opacity? : number;
        backgroundColor? : number;
        nodes?: Array<INodeData>;
        links?: Array<ILinkData>;
        quality? : string;
        flat? : boolean;
        flow? : boolean;
        stats? : boolean;
        charge? : number;
        distance? : number;
        colorType ? : string;
        shadows ? : boolean; 
    }
    
    
    
    export interface INodeData{
        x? : number;
        y? : number;
        z?: number;
        group?:any;  
    }
    
    export interface ILinkData{
        source : any;
        target : any;
        value : any;
    }
    
    
    
    
    
    export interface IFocusableElement{
        setFocused() : void;
        setUnFocused() : void;
    }
    
    
    export interface IWorker extends Worker{
        postMessage(message : IWorkerMessaqe, rest? : any) : void;
    }
    
    export interface IWorkerMessaqe { // extends MessageEvent{
        message : string;
        content : any;
        type : string;
    }
    
}
