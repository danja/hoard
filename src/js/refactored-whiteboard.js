// config.js
const WhiteboardConfig = {
  defaults: {
    viewBox: { x: 0, y: 0, width: 800, height: 600 },
    scale: 1,
    zoomSensitivity: 0.001,
    strokeWidth: 2,
    strokeColor: 'black'
  },
  tools: {
    draw: { icon: '✏️', cursor: 'crosshair' },
    pan: { icon: '🤚', cursor: 'grab' },
    erase: { icon: '🗑️', cursor: 'pointer' }
  }
};

// utils.js
class ViewportUtils {
  static getPoint(event, svg, viewBox) {
    const rect = svg.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    return {
      x: ((point.clientX - rect.left) / rect.width) * viewBox.width + viewBox.x,
      y: ((point.clientY - rect.top) / rect.height) * viewBox.height + viewBox.y
    };
  }

  static getPointsDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static getTouchCenter(touch1, touch2, svg, viewBox) {
    const rect = svg.getBoundingClientRect();
    return {
      x: ((touch1.clientX + touch2.clientX) / 2 - rect.left) / rect.width * viewBox.width + viewBox.x,
      y: ((touch1.clientY + touch2.clientY) / 2 - rect.top) / rect.height * viewBox.height + viewBox.y
    };
  }
}

// tools/Tool.js
class Tool {
  constructor(whiteboard) {
    this.whiteboard = whiteboard;
  }
  
  onStart() {}
  onMove() {}
  onEnd() {}
}

// tools/DrawTool.js
class DrawTool extends Tool {
  constructor(whiteboard) {
    super(whiteboard);
    this.isDrawing = false;
    this.currentPath = null;
  }

  onStart(event) {
    const point = ViewportUtils.getPoint(event, this.whiteboard.svg, this.whiteboard.viewBox);
    this.isDrawing = true;
    this.currentPath = this.createPath(point);
    this.whiteboard.svg.appendChild(this.currentPath);
  }

  onMove(event) {
    if (!this.isDrawing) return;
    const point = ViewportUtils.getPoint(event, this.whiteboard.svg, this.whiteboard.viewBox);
    const d = this.currentPath.getAttribute('d');
    this.currentPath.setAttribute('d', `${d} L ${point.x} ${point.y}`);
  }

  onEnd() {
    this.isDrawing = false;
    this.currentPath = null;
  }

  createPath(point) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke', WhiteboardConfig.defaults.strokeColor);
    path.setAttribute('stroke-width', WhiteboardConfig.defaults.strokeWidth);
    path.setAttribute('fill', 'none');
    path.setAttribute('d', `M ${point.x} ${point.y}`);
    return path;
  }
}

// tools/PanTool.js
class PanTool extends Tool {
  constructor(whiteboard) {
    super(whiteboard);
    this.isPanning = false;
    this.lastPoint = null;
  }

  onStart(event) {
    this.isPanning = true;
    this.lastPoint = ViewportUtils.getPoint(event, this.whiteboard.svg, this.whiteboard.viewBox);
  }

  onMove(event) {
    if (!this.isPanning) return;
    const point = ViewportUtils.getPoint(event, this.whiteboard.svg, this.whiteboard.viewBox);
    
    if (this.lastPoint) {
      const dx = point.x - this.lastPoint.x;
      const dy = point.y - this.lastPoint.y;
      this.whiteboard.updateViewBox({
        x: this.whiteboard.viewBox.x - dx,
        y: this.whiteboard.viewBox.y - dy
      });
    }
    
    this.lastPoint = point;
  }

  onEnd() {
    this.isPanning = false;
    this.lastPoint = null;
  }
}

// tools/EraseTool.js
class EraseTool extends Tool {
  onStart(event) {
    this.erase(event);
  }

  onMove(event) {
    this.erase(event);
  }

  erase(event) {
    const elements = document.elementsFromPoint(event.clientX, event.clientY);
    elements.forEach(el => {
      if (el.tagName === 'path' && el !== this.whiteboard.currentPath) {
        el.remove();
      }
    });
  }
}

// Whiteboard.js
class Whiteboard {
  constructor(options = {}) {
    this.config = { ...WhiteboardConfig.defaults, ...options };
    this.svg = document.querySelector('.whiteboard');
    this.viewBox = { ...this.config.viewBox };
    this.scale = this.config.scale;
    
    this.tools = {
      draw: new DrawTool(this),
      pan: new PanTool(this),
      erase: new EraseTool(this)
    };
    
    this.currentTool = 'draw';
    this.isGesturing = false;
    this.lastGestureDistance = 0;
    
    this.setupSVG();
    this.setupControls();
    this.addEventListeners();
  }

  setupSVG() {
    this.updateViewBox();
  }

  updateViewBox(updates = {}) {
    Object.assign(this.viewBox, updates);
    this.svg.setAttribute('viewBox', 
      `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`
    );
  }

  setupControls() {
    const controls = document.querySelector('.controls');
    Object.entries(WhiteboardConfig.tools).forEach(([name, props]) => {
      const btn = document.createElement('button');
      btn.className = `tool-btn ${name === this.currentTool ? 'active' : ''}`;
      btn.dataset.tool = name;
      btn.innerHTML = props.icon;
      btn.addEventListener('click', () => this.setTool(name));
      controls.appendChild(btn);
    });
  }

  setTool(name) {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === name);
    });
    this.currentTool = name;
    this.svg.style.cursor = WhiteboardConfig.tools[name].cursor;
  }

  handleZoom(point, factor) {
    requestAnimationFrame(() => {
      this.updateViewBox({
        x: point.x - (point.x - this.viewBox.x) * factor,
        y: point.y - (point.y - this.viewBox.y) * factor,
        width: this.viewBox.width * factor,
        height: this.viewBox.height * factor
      });
      this.scale /= factor;
    });
  }

  addEventListeners() {
    // Pointer events
    this.svg.addEventListener('pointerdown', e => {
      if (!this.isGesturing) {
        this.tools[this.currentTool].onStart(e);
      }
    });

    this.svg.addEventListener('pointermove', e => {
      if (!this.isGesturing) {
        this.tools[this.currentTool].onMove(e);
      }
    });

    this.svg.addEventListener('pointerup', () => {
      this.tools[this.currentTool].onEnd();
    });

    this.svg.addEventListener('pointerleave', () => {
      this.tools[this.currentTool].onEnd();
    });

    // Wheel zoom
    this.svg.addEventListener('wheel', e => {
      e.preventDefault();
      const point = ViewportUtils.getPoint(e, this.svg, this.viewBox);
      const factor = Math.pow(1.001, e.deltaY);
      this.handleZoom(point, factor);
    }, { passive: false });

    // Touch gestures
    this.svg.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        this.isGesturing = true;
        this.lastGestureDistance = ViewportUtils.getPointsDistance(e.touches[0], e.touches[1]);
      }
    });

    this.svg.addEventListener('touchmove', e => {
      if (this.isGesturing && e.touches.length === 2) {
        const newDistance = ViewportUtils.getPointsDistance(e.touches[0], e.touches[1]);
        const center = ViewportUtils.getTouchCenter(e.touches[0], e.touches[1], this.svg, this.viewBox);
        
        if (this.lastGestureDistance && Math.abs(1 - newDistance/this.lastGestureDistance) > 0.01) {
          this.handleZoom(center, newDistance/this.lastGestureDistance);
        }
        
        this.lastGestureDistance = newDistance;
      }
    });

    this.svg.addEventListener('touchend', () => {
      this.isGesturing = false;
      this.lastGestureDistance = 0;
    });
  }
}

// Initialize
window.whiteboard = new Whiteboard();
