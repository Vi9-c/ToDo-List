const todoInput = document.querySelector('.todo-input');
const alarmInput = document.querySelector('.alarm-input');
const todoButton = document.querySelector('.todo-button');
const todoList = document.querySelector('.todo-list');
const filterOption = document.querySelector('.filter-todo');
const form = document.querySelector('.form');
let alarmTimeouts = [];
let editingIndex = -1;
let editingOldText = '';

// Event Listeners
document.addEventListener('DOMContentLoaded', getLocalTodos);
form.addEventListener('submit', addTodo);
todoList.addEventListener('click', deleteCheck);
filterOption.addEventListener('change', filterTodo);
todoInput.addEventListener('input', capitalizeFirstLetter);

function getPureTaskText(element) {
  let text = element.innerText;
  const dashIndex = text.lastIndexOf(' - ');
  if (dashIndex > -1) {
    text = text.substring(0, dashIndex).trim();
  }
  return text;
}

function addTodo(event) {
  event.preventDefault();
  if (!todoInput.value) return;

  if (editingIndex > -1) {
    clearAlarm(editingOldText);
    let todos = JSON.parse(localStorage.getItem("todos"));
    const newText = todoInput.value;
    const newAlarmTime = alarmInput.value || null;
    todos[editingIndex].text = newText;
    todos[editingIndex].alarmTime = newAlarmTime;
    localStorage.setItem("todos", JSON.stringify(todos));
    // Update UI
    const todoDiv = document.querySelector(`[data-original-index="${editingIndex}"]`);
    if (todoDiv) {
      let displayText = newText;
      if (newAlarmTime) {
        const alarmDate = new Date(newAlarmTime);
        const timeString = alarmDate.toLocaleString([], {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
        displayText += ` - <span class="alarm-time">${timeString}</span>`;
      }
      todoDiv.children[0].innerHTML = displayText;
    }
    // Reschedule alarm if applicable
    if (newAlarmTime && !todos[editingIndex].completed) {
      const alarmDate = new Date(newAlarmTime);
      if (alarmDate > new Date()) {
        const timeDiff = alarmDate - new Date();
        const timeoutId = setTimeout(() => notify(newText), timeDiff);
        alarmTimeouts.push({id: timeoutId, text: newText});
      }
    }
    editingIndex = -1;
    todoButton.innerHTML = '<i class="fas fa-plus-square"></i>';
  } else {
    const alarmTime = alarmInput.value || null;
    const todoObj = {text: todoInput.value, completed: false, alarmTime};
    const todoDiv = document.createElement('div');
    todoDiv.classList.add('todo');
    const newTodo = document.createElement('li');
    let displayText = todoObj.text;
    if (todoObj.alarmTime) {
      const alarmDate = new Date(todoObj.alarmTime);
      const timeString = alarmDate.toLocaleString([], {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
      displayText += ` - <span class="alarm-time">${timeString}</span>`;
    }
    newTodo.innerHTML = displayText;
    newTodo.classList.add('todo-item');
    todoDiv.appendChild(newTodo);
    // Adding to local storage
    saveLocalTodos(todoObj);
    const completedButton = document.createElement('button');
    completedButton.innerHTML = '<i class="fas fa-check"></i>';
    completedButton.classList.add('complete-btn');
    todoDiv.appendChild(completedButton);

    const trashButton = document.createElement('button');
    trashButton.innerHTML = '<i class="fas fa-trash"></i>';
    trashButton.classList.add('trash-btn');
    todoDiv.appendChild(trashButton);

    const editButton = document.createElement('button');
    editButton.innerHTML = '<i class="fas fa-edit"></i>';
    editButton.classList.add('edit-btn');
    todoDiv.appendChild(editButton);

    let todos = JSON.parse(localStorage.getItem("todos"));
    const index = todos.length - 1;
    todoDiv.dataset.originalIndex = index;

    todoList.appendChild(todoDiv);

    // Schedule alarm if applicable
    if (todoObj.alarmTime && !todoObj.completed) {
      const alarmDate = new Date(todoObj.alarmTime);
      if (alarmDate > new Date()) {
        const timeDiff = alarmDate - new Date();
        const timeoutId = setTimeout(() => notify(todoObj.text), timeDiff);
        alarmTimeouts.push({id: timeoutId, text: todoObj.text});
      }
    }
  }

  todoInput.value = '';
  alarmInput.value = '';
}

function deleteCheck(e) {
  const button = e.target.closest('button');
  if (!button) return;

  if (button.classList.contains("edit-btn")) {
    const todo = button.parentElement;
    editingIndex = parseInt(todo.dataset.originalIndex);
    editingOldText = getPureTaskText(todo.children[0]);
    todoInput.value = editingOldText;
    let todos = JSON.parse(localStorage.getItem("todos"));
    const todoObj = todos[editingIndex];
    const alarmTime = todoObj.alarmTime;
    if (alarmTime) {
      const date = new Date(alarmTime);
      alarmInput.value = date.toISOString().slice(0, 16);
    } else {
      alarmInput.value = '';
    }
    todoButton.innerHTML = '<i class="fas fa-save"></i>';
    // Selected effect
    button.style.transform = 'scale(0.95)';
    button.style.opacity = '0.8';
    setTimeout(() => {
      button.style.transform = '';
      button.style.opacity = '';
    }, 200);
    return;
  }

  if (button.classList.contains("trash-btn")) {
    const todo = button.parentElement;
    todo.style.opacity = '0.5';
    todo.classList.add("slide");
    
    removeLocalTodos(todo);
    todo.addEventListener("transitionend", function () {
      todo.remove();
    });
  }

  if (button.classList.contains("complete-btn")) {
    const todo = button.parentElement;
    const isCompleted = todo.classList.contains("completed");
    todo.classList.toggle("completed");
    const newCompleted = !isCompleted;
    const todoText = getPureTaskText(todo.children[0]);
    updateLocalTodo(todoText, newCompleted);
    const completeIcon = button.querySelector('i');
    if (newCompleted) {
      completeIcon.className = 'fas fa-undo';
    } else {
      completeIcon.className = 'fas fa-check';
    }
    // Selected effect
    button.style.transform = 'scale(0.95)';
    button.style.opacity = '0.8';
    setTimeout(() => {
      button.style.transform = '';
      button.style.opacity = '';
    }, 200);
  }
}

function filterTodo(e) {
  const todos = todoList.childNodes;
  todos.forEach(function (todo) {
    switch (e.target.value) {
      case "all":
        todo.style.display = "flex"
        break;
    
      case "completed":
        if (todo.classList.contains("completed")) {
          todo.style.display = "flex";
        }
        else {
          todo.style.display = "none";
        }
        break;
      case "uncompleted":
        if (!todo.classList.contains("completed")) {
          todo.style.display = "flex";
        } else {
          todo.style.display = "none";
        }
        break;
    }
  });
}

function updateLocalTodo(todoText, newCompleted) {
  let todos;
  if (localStorage.getItem("todos") === null) {
    todos = [];
  } else {
    todos = JSON.parse(localStorage.getItem("todos"));
  }
  const todoIndex = todos.findIndex(t => typeof t === 'string' ? t === todoText : t.text === todoText);
  if (todoIndex > -1) {
    if (typeof todos[todoIndex] === 'string') {
      todos[todoIndex] = {text: todoText, completed: newCompleted, alarmTime: null};
    } else {
      todos[todoIndex].completed = newCompleted;
    }
    localStorage.setItem("todos", JSON.stringify(todos));
  }
  if (newCompleted) {
    clearAlarm(todoText);
  }
  // Re-render to update display
  const sortedTodos = getSortedTodos();
  renderTodos(sortedTodos);
}

function saveLocalTodos(todoObj) {
  let todos;
  if (localStorage.getItem("todos") === null) {
    todos = [];
  } else {
    todos = JSON.parse(localStorage.getItem("todos"));
  }
  todos.push(todoObj);
  localStorage.setItem("todos", JSON.stringify(todos));
}

function playBeep() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.value = 440; // A4 note
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

async function notify(taskText) {
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  if (Notification.permission === 'granted') {
    new Notification('To Do Alarm', {
      body: `${taskText} is due now!`,
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMi4wODIgMiAyIDMuMDgyIDIgMTJTMi4wODIgMjIgMTIgMjJTMjIgMjAuOTE4IDIyIDEyUzIxLjkxOCAyIDEyIDJ6IiBmaWxsPSIjMDBmZmZmIi8+CjxwYXRoIGQ9Ik0xMiA0QzcuNDcgNCA1IDcuNDcgNSA5LjU1UzcuNDcgMTQgMTIgMTRTMjAgMTIuNDUgMjAgOS41NVMyMC4yOSAxMiA1LTIwIDUuNDUgMjAgNSAyMCIgZmlsbD0iIzAwZmZmZiIvPgo8L3N2Zz4K' // Simple clock icon base64
    });
  }
  playBeep();
}

function clearAlarm(todoText) {
  const index = alarmTimeouts.findIndex(at => at.text === todoText);
  if (index > -1) {
    clearTimeout(alarmTimeouts[index].id);
    alarmTimeouts.splice(index, 1);
  }
}

function getSortedTodos() {
  let todos;
  if (localStorage.getItem("todos") === null) {
    todos = []
  } else{
    todos = JSON.parse(localStorage.getItem("todos"));
  }
  // Sort todos: tasks with alarmTime first (by alarmTime asc), then without (by addition order asc)
  return todos.map((todo, index) => {
    let todoObj;
    if (typeof todo === 'string') {
      todoObj = {text: todo, completed: false, alarmTime: null, originalIndex: index};
    } else {
      todoObj = {...todo, originalIndex: index};
      if (!todoObj.hasOwnProperty('alarmTime')) {
        todoObj.alarmTime = null;
      }
    }
    return todoObj;
  }).sort((a, b) => {
    if (a.alarmTime && b.alarmTime) {
      return new Date(a.alarmTime) - new Date(b.alarmTime);
    } else if (a.alarmTime) {
      return -1;
    } else if (b.alarmTime) {
      return 1;
    } else {
      return a.originalIndex - b.originalIndex;
    }
  });
}

function renderTodos(sortedTodos) {
  todoList.innerHTML = ''; // Clear the list
  alarmTimeouts = []; // Clear previous timeouts
  for (let i = 0; i < sortedTodos.length; i++) {
    const todoObj = sortedTodos[i];
    const todoDiv = document.createElement("div");
    todoDiv.dataset.originalIndex = todoObj.originalIndex;
    todoDiv.classList.add("todo");
    if (todoObj.completed) {
      todoDiv.classList.add("completed");
    }
    const newTodo = document.createElement("li");
    let displayText = todoObj.text;
    if (todoObj.alarmTime) {
      const alarmDate = new Date(todoObj.alarmTime);
      const timeString = alarmDate.toLocaleString([], {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
      displayText += ` - <span class="alarm-time">${timeString}</span>`;
    }
    newTodo.innerHTML = displayText;
    newTodo.classList.add("todo-item");
    todoDiv.appendChild(newTodo);

    const completedButton = document.createElement("button");
    completedButton.innerHTML = todoObj.completed ? '<i class="fas fa-undo"></i>' : '<i class="fas fa-check"></i>';
    completedButton.classList.add("complete-btn");
    todoDiv.appendChild(completedButton)

    const trashButton = document.createElement("button");
    trashButton.innerHTML = '<i class="fas fa-trash"></i>';
    trashButton.classList.add("trash-btn");
    todoDiv.appendChild(trashButton);

    const editButton = document.createElement("button");
    editButton.innerHTML = '<i class="fas fa-edit"></i>';
    editButton.classList.add("edit-btn");
    todoDiv.appendChild(editButton);

    todoList.appendChild(todoDiv)

    // Schedule alarm if applicable
    if (todoObj.alarmTime && !todoObj.completed) {
      const alarmDate = new Date(todoObj.alarmTime);
      if (alarmDate > new Date()) {
        const timeDiff = alarmDate - new Date();
        const timeoutId = setTimeout(() => notify(todoObj.text), timeDiff);
        alarmTimeouts.push({id: timeoutId, text: todoObj.text});
      }
    }
  }
}

function getLocalTodos() {
  const sortedTodos = getSortedTodos();
  renderTodos(sortedTodos);
  // Reset form on load
  editingIndex = -1;
  todoInput.value = '';
  alarmInput.value = '';
  todoButton.innerHTML = '<i class="fas fa-plus-square"></i>';
}

function capitalizeFirstLetter() {
  const value = todoInput.value;
  if (value.length === 1) {
    todoInput.value = value.toUpperCase();
  }
}

function removeLocalTodos(todo) {
  const todoText = getPureTaskText(todo.children[0]);
  clearAlarm(todoText);
  let todos;
  if (localStorage.getItem("todos") === null) {
    todos = [];
  } else {
    todos = JSON.parse(localStorage.getItem("todos"));
  }
  const todoIndexInArray = todos.findIndex(t => typeof t === 'string' ? t === todoText : t.text === todoText);
  if (todoIndexInArray > -1) {
    todos.splice(todoIndexInArray, 1);
  }
  localStorage.setItem("todos", JSON.stringify(todos));
  // Re-render to maintain order
  const sortedTodos = getSortedTodos();
  renderTodos(sortedTodos);
}
