/* =====================================================
   IT Help · Sistema de Tickets (SPA)
   ===================================================== */

// ---------- Estado global ----------
let tickets = JSON.parse(localStorage.getItem('ithelp_tickets')) || [];

// ---------- Referencias DOM ----------
const form          = document.getElementById('ticketForm');
const inputName     = document.getElementById('nombre');
const inputEmail    = document.getElementById('email');
const inputPriority = document.getElementById('prioridad');
const inputMessage  = document.getElementById('mensaje');
const list          = document.getElementById('ticketList');
const urgentBadge   = document.getElementById('urgentCounter');
const totalBadge    = document.getElementById('totalCounter');
const filterPriority= document.getElementById('filterPriority');
const searchText    = document.getElementById('searchText');
const clearAllBtn   = document.getElementById('clearAll');

// ---------- Persistencia ----------
function saveToStorage() {
  localStorage.setItem('ithelp_tickets', JSON.stringify(tickets));
}

// ---------- Validación de campos ----------
function validateField(input, condition) {
  if (condition) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    return true;
  } else {
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');
    return false;
  }
}

function validateForm() {
  const okName    = validateField(inputName, inputName.value.trim().length >= 3);
  const emailRe   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const okEmail   = validateField(inputEmail, emailRe.test(inputEmail.value.trim()));
  const okMessage = validateField(inputMessage, inputMessage.value.trim().length >= 10);
  return okName && okEmail && okMessage;
}

// ---------- DEMO control de flujo #1: switch para asignar clase CSS ----------
function getPriorityClass(priority) {
  switch (priority) {
    case 'alta':   return 'priority-alta';
    case 'normal': return 'priority-normal';
    case 'baja':   return 'priority-baja';
    default:       return 'priority-normal';
  }
}

// ---------- DEMO control de flujo #2: contar palabras con for ----------
function countWords(text) {
  let count = 0;
  let inWord = false;
  for (let i = 0; i < text.length; i++) {
    const isSpace = text[i] === ' ' || text[i] === '\n' || text[i] === '\t';
    if (!isSpace && !inWord) { count++; inWord = true; }
    else if (isSpace)        { inWord = false; }
  }
  return count;
}

// ---------- Crear ticket ----------
function createTicket(name, email, priority, message) {
  const now = new Date();
  // Construcción del objeto Message
  const ticket = {
    id: Date.now() + Math.random().toString(36).slice(2, 7),
    name: name,
    email: email,
    priority: priority,
    message: message,
    date: now.toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }),
    timestamp: now.getTime(),
    read: false,
    wordCount: countWords(message) // demo bucle for
  };
  tickets.unshift(ticket); // más reciente arriba
  saveToStorage();
  render();
}

// ---------- Render ----------
function render() {
  const filterBy = filterPriority.value;
  const search   = searchText.value.trim().toLowerCase();

  // Filtros combinados
  let visible = tickets.filter(t => {
    const matchPriority = filterBy === 'all' || t.priority === filterBy;
    const matchSearch   = search === '' ||
                          t.message.toLowerCase().includes(search) ||
                          t.name.toLowerCase().includes(search);
    return matchPriority && matchSearch;
  });

  // Contador urgentes (sobre TODOS los tickets, no filtrados)
  const urgentCount = tickets.filter(t => t.priority === 'alta').length;
  urgentBadge.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> ${urgentCount} urgentes`;

  totalBadge.textContent = tickets.length;

  // Pintar
  list.innerHTML = '';
  if (visible.length === 0) {
    list.innerHTML = `<div class="col-12 text-center text-muted py-5">
      <i class="bi bi-inbox fs-1"></i><p>No hay tickets que coincidan.</p>
    </div>`;
    return;
  }

  visible.forEach(t => {
    const cls = getPriorityClass(t.priority); // switch
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    col.innerHTML = `
      <div class="card ticket-card ${cls} ${t.read ? '' : 'unread'} h-100 position-relative">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="card-title mb-0">${escapeHtml(t.name)}</h6>
            <span class="badge badge-priority ${
              t.priority === 'alta'   ? 'bg-danger' :
              t.priority === 'normal' ? 'bg-primary' : 'bg-success'
            }">${t.priority}</span>
          </div>
          <p class="ticket-meta mb-1">
            <i class="bi bi-envelope"></i> ${escapeHtml(t.email)}
          </p>
          <p class="ticket-meta mb-2">
            <i class="bi bi-clock"></i> ${t.date} · ${t.wordCount} palabras
          </p>
          <p class="card-text">${escapeHtml(t.message)}</p>
        </div>
        <div class="card-footer bg-transparent d-flex gap-2">
          <button class="btn btn-sm btn-outline-info flex-fill" data-action="toggleRead" data-id="${t.id}">
            <i class="bi ${t.read ? 'bi-envelope' : 'bi-envelope-open'}"></i>
            ${t.read ? 'No leído' : 'Leído'}
          </button>
          <button class="btn btn-sm btn-outline-danger flex-fill" data-action="delete" data-id="${t.id}">
            <i class="bi bi-trash"></i> Eliminar
          </button>
        </div>
      </div>
    `;
    list.appendChild(col);
  });
}

// ---------- Utilidad anti-XSS ----------
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ---------- Eventos ----------

// Submit
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validateForm()) return;
  createTicket(
    inputName.value.trim(),
    inputEmail.value.trim(),
    inputPriority.value,
    inputMessage.value.trim()
  );
  form.reset();
  inputPriority.value = 'normal';
  document.querySelectorAll('.is-valid, .is-invalid')
    .forEach(el => el.classList.remove('is-valid', 'is-invalid'));
});

// Filtro + búsqueda
filterPriority.addEventListener('change', render);
searchText.addEventListener('input', render);

// Delegación de eventos (eliminar / marcar leído)
list.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  const idx = tickets.findIndex(t => t.id === id);
  if (idx === -1) return;

  if (action === 'delete') {
    if (confirm('¿Eliminar este ticket?')) {
      tickets.splice(idx, 1);
      saveToStorage();
      render();
    }
  } else if (action === 'toggleRead') {
    tickets[idx].read = !tickets[idx].read;
    saveToStorage();
    render();
  }
});

// Borrar todos
clearAllBtn.addEventListener('click', () => {
  if (tickets.length === 0) return;
  if (confirm('¿Borrar TODOS los tickets?')) {
    tickets = [];
    saveToStorage();
    render();
  }
});

// ---------- Init ----------
render();