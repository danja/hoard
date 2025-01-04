// tools/ShapeTool.js
class ShapeTool extends Tool {
  constructor(whiteboard, shapeType) {
    super(whiteboard);
    this.shapeType = shapeType;
    this.isDrawing = false;
    this.currentShape = null;
    this.startPoint = null;
  }

  onStart(event) {
    const point = ViewportUtils.getPoint(event, this.whiteboard.svg, this.whiteboard.viewBox);
    this.isDrawing = true;
    this.startPoint = point;
    this.currentShape = this.createShape(point);
    this.whiteboard.svg.appendChild(this.currentShape);
  }

  onMove(event) {
    if (!this.isDrawing) return;
    
    const currentPoint = ViewportUtils.getPoint(event, this.whiteboard.svg, this.whiteboard.viewBox);
    this.updateShape(this.startPoint, currentPoint);
  }

  onEnd() {
    if (!this.isDrawing) return;
    
    this.isDrawing = false;
    if (this.currentShape) {
      const command = new ShapeCommand(this.whiteboard, this.currentShape);
      this.whiteboard.commandManager.execute(command);
    }
    this.currentShape = null;
    this.startPoint = null;
  }

  createShape() {
    throw new Error('createShape must be implemented by subclasses');
  }

  updateShape() {
    throw new Error('updateShape must be implemented by subclasses');
  }
}

// tools/RectangleTool.js
class RectangleTool extends ShapeTool {
  constructor(whiteboard) {
    super(whiteboard, 'rectangle');
  }

  createShape(point) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', point.x);
    rect.setAttribute('y', point.y);
    rect.setAttribute('width', 0);
    rect.setAttribute('height', 0);
    rect.setAttribute('stroke', this.whiteboard.currentStyle.strokeColor);
    rect.setAttribute('stroke-width', this.whiteboard.currentStyle.strokeWidth);
    rect.setAttribute('fill', this.whiteboard.currentStyle.fill);
    return rect;
  }

  updateShape(startPoint, currentPoint) {
    if (!this.currentShape) return;

    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);

    this.currentShape.setAttribute('x', x);
    this.currentShape.setAttribute('y', y);
    this.currentShape.setAttribute('width', width);
    this.currentShape.setAttribute('height', height);
  }
}

// tools/CircleTool.js
class CircleTool extends ShapeTool {
  constructor(whiteboard) {
    super(whiteboard, 'circle');
  }

  createShape(point) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', point.x);
    circle.setAttribute('cy', point.y);
    circle.setAttribute('r', 0);
    circle.setAttribute('stroke', this.whiteboard.currentStyle.strokeColor);
    circle.setAttribute('stroke-width', this.whiteboard.currentStyle.strokeWidth);
    circle.setAttribute('fill', this.whiteboard.currentStyle.fill);
    return circle;
  }

  updateShape(startPoint, currentPoint) {
    if (!this.currentShape) return;

    const radius = Math.sqrt(
      Math.pow(currentPoint.x - startPoint.x, 2) +
      Math.pow(currentPoint.y - startPoint.y, 2)
    );

    this.currentShape.setAttribute('r', radius);
  }
}

// tools/LineTool.js
class LineTool extends ShapeTool {
  constructor(whiteboard) {
    super(whiteboard, 'line');
  }

  createShape(point) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', point.x);
    line.setAttribute('y1', point.y);
    line.setAttribute('x2', point.x);
    line.setAttribute('y2', point.y);
    line.setAttribute('stroke', this.whiteboard.currentStyle.strokeColor);
    line.setAttribute('stroke-width', this.whiteboard.currentStyle.strokeWidth);
    return line;
  }

  updateShape(startPoint, currentPoint) {
    if (!this.currentShape) return;

    this.currentShape.setAttribute('x2', currentPoint.x);
    this.currentShape.setAttribute('y2', currentPoint.y);
  }
}

export { ShapeTool, RectangleTool, CircleTool, LineTool };
