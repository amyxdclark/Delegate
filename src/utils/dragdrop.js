// Drag and drop utilities

export function makeDraggable(element, data, onDragStart, onDragEnd) {
  element.draggable = true;
  
  element.addEventListener('dragstart', (e) => {
    element.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    if (onDragStart) onDragStart(data);
  });
  
  element.addEventListener('dragend', (e) => {
    element.classList.remove('dragging');
    if (onDragEnd) onDragEnd(data);
  });
}

export function makeDroppable(element, onDrop, onDragOver) {
  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    element.classList.add('drag-over');
    if (onDragOver) onDragOver(e);
  });
  
  element.addEventListener('dragleave', (e) => {
    element.classList.remove('drag-over');
  });
  
  element.addEventListener('drop', (e) => {
    e.preventDefault();
    element.classList.remove('drag-over');
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (onDrop) onDrop(data);
    } catch (err) {
      console.error('Failed to parse drag data:', err);
    }
  });
}
