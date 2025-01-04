// commands/Command.js
class Command {
  constructor(whiteboard) {
    this.whiteboard = whiteboard;
  }
  
  execute() {}
  undo() {}
}

// commands/DrawCommand.js
class DrawCommand extends Command {
  constructor(whiteboard, pathElement) {
    super(whiteboard);
    this.pathElement = pathElement;
  }

  execute() {
    this.whiteboard.svg.appendChild(this.pathElement);
  }

  undo() {
    this.pathElement.remove();
  }
}

// commands/ShapeCommand.js
class ShapeCommand extends Command {
  constructor(whiteboard, shapeElement) {
    super(whiteboard);
    this.shapeElement = shapeElement;
  }

  execute() {
    this.whiteboard.svg.appendChild(this.shapeElement);
  }

  undo() {
    this.shapeElement.remove();
  }
}

// commands/EraseCommand.js
class EraseCommand extends Command {
  constructor(whiteboard, elements) {
    super(whiteboard);
    this.elements = elements;
    this.parentNodes = elements.map(el => el.parentNode);
    this.nextSiblings = elements.map(el => el.nextSibling);
  }

  execute() {
    this.elements.forEach(element => element.remove());
  }

  undo() {
    this.elements.forEach((element, index) => {
      if (this.parentNodes[index]) {
        this.parentNodes[index].insertBefore(element, this.nextSiblings[index]);
      }
    });
  }
}

// CommandManager.js
class CommandManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
  }

  execute(command) {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = []; // Clear redo stack when new command is executed
  }

  undo() {
    if (this.undoStack.length === 0) return;
    
    const command = this.undoStack.pop();
    command.undo();
    this.redoStack.push(command);
  }

  redo() {
    if (this.redoStack.length === 0) return;
    
    const command = this.redoStack.pop();
    command.execute();
    this.undoStack.push(command);
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

export { Command, DrawCommand, ShapeCommand, EraseCommand, CommandManager };
