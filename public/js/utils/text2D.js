import {
	Texture,
    MeshBasicMaterial,
    PlaneGeometry,
    Mesh
} from '../three.module.min.js';

var Text2D = /** @class */ (function () {
    function Text2D(scene, camera) {
        this.timer = performance || Date;
        this.msActive = false;
        this.msStart = this.timer.now();
        this.msEnd = this.timer.now();
        this.msGraphData = new Array(32).fill(0);
        this.ms = 0;
        this.statsDisplayRefreshDelay = 100;
        this.fpsLastTime = this.timer.now();
        this.fpsFrames = 0;
        this.fpsGraphData = new Array(32).fill(0);
        this.camera = camera;
        if (this.camera.parent === null) {
            scene.add(camera);
        }
        this.canvas = document.createElement("canvas");
        this.canvas.width = 200;
        this.canvas.height = 200;
        this.ctx = this.canvas.getContext("2d");
        this.texture = new Texture(this.canvas);
        var material = new MeshBasicMaterial({
            map: this.texture,
            depthTest: false,
            transparent: true,
        });
        var geometry = new PlaneGeometry(1, 1, 1, 1);
        this.statsPlane = new Mesh(geometry, material);
        this.statsPlane.position.x = 0;
        this.statsPlane.position.y = 1.5;
        this.statsPlane.position.z = -5;
        this.statsPlane.renderOrder = 9999;
        this.camera.add(this.statsPlane);
    }
    Text2D.prototype.setEnabled = function (enabled) {
        this.statsPlane.visible = enabled;
    };
    Text2D.prototype.setX = function (val) {
        this.statsPlane.position.x = val;
    };
    Text2D.prototype.setY = function (val) {
        this.statsPlane.position.y = val;
    };
    Text2D.prototype.setZ = function (val) {
        this.statsPlane.position.z = val;
    };
    Text2D.prototype.setCustom1 = function (val) {
        this.custom1 = val;
    };
    Text2D.prototype.setCustom2 = function (val) {
        this.custom2 = val;
    };
    Text2D.prototype.setCustom3 = function (val) {
        this.custom3 = val;
    };
    Text2D.prototype.startTimer = function () {
        this.msActive = true;
        this.msStart = this.timer.now();
    };
    Text2D.prototype.endTimer = function () {
        this.msEnd = this.timer.now();
        this.ms = ((this.msEnd - this.msStart) * 100) / 100;
    };
    Text2D.prototype.add = function (object3d) {
        this.camera.add(object3d);
    };
    Text2D.prototype.update = function () {
        this.texture.needsUpdate = true;
        var now = this.timer.now();
        var dt = now - this.fpsLastTime;
        this.fpsFrames++;
        if (now > this.fpsLastTime + this.statsDisplayRefreshDelay) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            //FPS
            this.fpsLastTime = now;
            //var FPS = ((((this.fpsFrames * 1000) / dt) * 100) / 100).toFixed(2);
            //this.fpsFrames = 0;
            //this.fpsGraphData.push(FPS);
            //if (this.fpsGraphData.length >= 32) {
            //    this.fpsGraphData.shift();
            //}
            //var ratio = Math.max.apply(null, this.fpsGraphData);
            //this.ctx.strokeStyle = "#035363";
            //for (var i = 0; i < 32; i++) {
            //    this.ctx.beginPath();
            //    this.ctx.moveTo(i, 16);
            //    this.ctx.lineTo(i, 16 - (this.fpsGraphData[i] / ratio) * 16);
            //    this.ctx.stroke();
            //}
            //this.ctx.font = "13px Calibri";
            //this.ctx.fillStyle = "#00cc00";
            //this.ctx.fillText(FPS, 1, 13);
            ////MS
            //if (this.msActive) {
            //    this.msGraphData.push(this.ms);
            //    if (this.msGraphData.length >= 32) {
            //        this.msGraphData.shift();
            //    }
            //    ratio = Math.max.apply(null, this.msGraphData);
            //    this.ctx.strokeStyle = "#f35363";
            //    for (var i = 0; i < 32; i++) {
            //        this.ctx.beginPath();
            //        this.ctx.moveTo(i + 32, 16);
            //        this.ctx.lineTo(i + 32, 16 - (this.msGraphData[i] / ratio) * 16);
            //        this.ctx.stroke();
            //    }
            //    this.ctx.font = "13px Calibri";
            //    this.ctx.fillStyle = "#00ccff";
            //    this.ctx.fillText(this.ms.toFixed(2), 33, 13);
            //}
            //Custom
            if (this.custom1) {
                this.ctx.font = "32px Calibri";
                this.ctx.fillStyle = "#ffffff";
                this.ctx.fillText(this.custom1, 0, 29);
            }
            if (this.custom2) {
                this.ctx.font = "11px";
                this.ctx.fillStyle = "#ffffff";
                this.ctx.fillText(this.custom2, 0, 45);
            }
            if (this.custom3) {
                this.ctx.font = "11px";
                this.ctx.fillStyle = "#ffffff";
                this.ctx.fillText(this.custom3, 0, 61);
            }
        }
    };
    return Text2D;
}());
export { Text2D };