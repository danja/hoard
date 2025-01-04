// Whiteboard.js
class Whiteboard {
  constructor(options = {}) {
    this.config = { ...WhiteboardConfig.defaults, ...options };
    this.svg = document.querySelector('.whiteboard');
    this.viewBox = { ...this.config.viewBox };
    this.scale = this.config.scale;
    
    this.currentStyle = {
      strokeColor: 'black',
      strokeWidth: 2,
      fill: 'none'
    };
    
    this.commandManager = new CommandManager();
    
    this.tools = {
      draw: new DrawTool(this),
      pan: new PanTool(this),
      erase: new EraseTool(this),
      rectangle: new RectangleTool(this),
      circle: new CircleTool(this),
      line: new LineTool(this)
    };
    
    this.currentTool = 'draw';
    this.isGesturing = false;
    this.lastGestureDistance = 0;
    
    this.setupSVG();
    this.setupControls();
    this.setupKeyboardShortcuts();
    this.addEventListeners();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            if (e.shiftKey) {
              this.commandManager.redo();
            } else {
              this.commandManager.undo();
            }
            e.preventDefault();
            break;
          case 'y':
            this.commandManager.redo();
            e.preventDefault();
            break;
        }
      }
    });
  }

  setupControls() {
    const controls = document.querySelector('.controls');
    controls.innerHTML = ''; // Clear existing controls
    
    // Add tool buttons
    Object.entries(WhiteboardConfig.tools).forEach(([name, props]) => {
      const btn = document.createElement('button');
      btn.className = `tool-btn ${name === this.currentTool ? 'active' : ''}`;
      btn.dataset.tool = name;
      btn.innerHTML = props.icon;
      btn.addEventListener('click', () => this.setTool(name));
      controls.appendChild(btn);
    });
    
    // Add undo/redo buttons
    const undoBtn = document.createElement('button');
    undoBtn.className = 'tool-btn';
    undoBtn.innerHTML = '↩️';
    undoBtn.addEventListener('click', () => this.commandManager.undo());
    controls.appendChild(undoBtn);
    
    const redoBtn = document.createElement('button');
    redoBtn.className = 'tool-btn';
    redoBtn.innerHTML = '↪️';
    redoBtn.addEventListener('click', () => this.commandManager.redo());
    controls.appendChild(redoBtn);
  }

  // ... (rest of the methods from previous Whiteboard class remain the same)
  
  clearCanvas() {
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }
    this.commandManager.clear();
  }
}

// Initialize with HTML structure
const initializeWhiteboard = () => {
  // Create HTML structure
  document.body.innerHTML = `
    <div class="whiteboard-container">
      <svg class="whiteboard"></svg>
      <div class="controls"></div>
      <div class="style-panel">
        <input type="color" id="stroke-color" value="#000000">
        <input type="range" id="stroke-width" min="1" max="10" value="2">
      </div>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .whiteboard-container {
      position: relative;
      width: 100vw;
      height: 100vh;
    }
    .whiteboard {
      width: 100%;
      height: 100%;
      touch-action: none;
    }
    .controls {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      padding: 10px;
      border-radius: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      gap: 10px;
      z-index: 1000;
    }
    .tool-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: #f3f4f6;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }
    .tool-btn.active {
      background: #dbeafe;
    }
    .style-panel {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 10px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 1000;
    }
  `;
  document.head.appendChild(style);

  // Initialize Whiteboard
  window.whiteboard = new Whiteboard();
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWhiteboard);
} else {
  initializeWhiteboard();
}
