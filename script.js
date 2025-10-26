const STORAGE_KEY = 'quiz_questions_v1';

// Utilities
const uid = () => 'q_' + Math.random().toString(36).slice(2, 9);

function loadQuestions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {

    const sample = [
      { id: uid(), text: 'Столица Франции?', options: ['Париж','Лондон','Берлин','Мадрид'], correct: 0 },
      { id: uid(), text: '2 + 2 = ?', options: ['3','4','5','6'], correct: 1 }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
    return sample;
  }
  try { return JSON.parse(raw) } catch(e) { return []; }
}

function saveQuestions(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

const qForm = document.getElementById('questionForm');
const qId = document.getElementById('qId');
const qText = document.getElementById('qText');
const optsInputs = Array.from(document.querySelectorAll('.opt'));
const correctIdx = document.getElementById('correctIdx');
const questionsTbody = document.getElementById('questionsTbody');

const manageSection = document.getElementById('manageSection');
const listSection = document.getElementById('listSection');
const quizSection = document.getElementById('quizSection');
const quizContent = document.getElementById('quizContent');

const startQuizBtn = document.getElementById('startQuizBtn');
const showManageBtn = document.getElementById('showManageBtn');
const submitQuiz = document.getElementById('submitQuiz');
const cancelQuiz = document.getElementById('cancelQuiz');

let questions = loadQuestions();
renderList();

function renderList() {
  questionsTbody.innerHTML = '';
  if (!questions.length) {
    questionsTbody.innerHTML = '<tr><td colspan="5" class="text-muted">Вопросов пока нет</td></tr>';
    return;
  }
  questions.forEach((q, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td style="max-width:300px">${escapeHtml(q.text)}</td>
      <td>${q.options.map((o, idx)=>`<div>${idx}. ${escapeHtml(o)}</div>`).join('')}</td>
      <td>${q.correct}</td>
      <td>
        <button class="btn btn-sm btn-primary me-1" data-id="${q.id}" data-action="edit">Ред.</button>
        <button class="btn btn-sm btn-danger" data-id="${q.id}" data-action="del">Удал.</button>
      </td>
    `;
    questionsTbody.appendChild(tr);
  });

  questionsTbody.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (action === 'edit') openEdit(id);
      if (action === 'del') removeQuestion(id);
    });
  });
}

qForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const id = qId.value;
  const text = qText.value.trim();
  const options = optsInputs.map(i => i.value.trim()).filter((v, idx)=> v !== '' || idx < 3); // allow 4th optional
  const corr = parseInt(correctIdx.value, 10);

  if (!text || options.length < 2) {
    alert('Нужен текст вопроса и минимум 2 варианта.');
    return;
  }
  if (corr < 0 || corr >= options.length) {
    alert('Правильный вариант вне диапазона.');
    return;
  }

  if (id) {

    const idx = questions.findIndex(q=>q.id === id);
    if (idx !== -1) {
      questions[idx] = { id, text, options, correct: corr };
      saveQuestions(questions);
      renderList();
      resetForm();
      toast('Вопрос обновлён');
    }
  } else {
    
    const newQ = { id: uid(), text, options, correct: corr };
    questions.push(newQ);
    saveQuestions(questions);
    renderList();
    resetForm();
    toast('Вопрос добавлен');
  }
});

document.getElementById('resetBtn').addEventListener('click', resetForm);

function resetForm() {
  qId.value = '';
  qText.value = '';
  optsInputs.forEach((el,i)=> el.value = '');
  correctIdx.value = 0;
  document.getElementById('saveBtn').textContent = 'Сохранить';
}


function openEdit(id) {
  const q = questions.find(x => x.id === id);
  if (!q) return;
  qId.value = q.id;
  qText.value = q.text;
  optsInputs.forEach((el,i)=> el.value = q.options[i] || '');
  correctIdx.value = q.correct;
  document.getElementById('saveBtn').textContent = 'Обновить';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function removeQuestion(id) {
  if (!confirm('Удалить вопрос окончательно?')) return;
  questions = questions.filter(q => q.id !== id);
  saveQuestions(questions);
  renderList();
  toast('Вопрос удалён');
}

startQuizBtn.addEventListener('click', ()=> {
  if (!questions.length) { alert('Вопросов нет, добавьте сначала.'); return; }
  showQuiz();
});

function showQuiz() {
  manageSection.classList.add('d-none');
  listSection.classList.add('d-none');
  quizSection.classList.remove('d-none');

  quizContent.innerHTML = '';
  questions.forEach((q, i)=>{
    const block = document.createElement('div');
    block.className = 'question-block';
    block.innerHTML = `<div><strong>Вопрос ${i+1}:</strong> ${escapeHtml(q.text)}</div>`;
    const ul = document.createElement('div');
    q.options.forEach((opt, idx)=>{
      const id = `q_${q.id}_opt_${idx}`;
      const radio = `<div class="form-check">
        <input class="form-check-input" type="radio" name="ans_${q.id}" id="${id}" value="${idx}">
        <label class="form-check-label" for="${id}">${escapeHtml(opt)}</label>
      </div>`;
      ul.insertAdjacentHTML('beforeend', radio);
    });
    block.appendChild(ul);
    quizContent.appendChild(block);
  });
}

submitQuiz.addEventListener('click', ()=>{
  let score = 0;
  questions.forEach(q=>{
    const selected = document.querySelector(`input[name="ans_${q.id}"]:checked`);
    if (selected && parseInt(selected.value,10) === q.correct) score++;
  });
  alert(`Результат: ${score} / ${questions.length}`);
  
  exitQuiz();
});

cancelQuiz.addEventListener('click', exitQuiz);

function exitQuiz(){
  quizSection.classList.add('d-none');
  manageSection.classList.remove('d-none');
  listSection.classList.remove('d-none');
}


function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

function toast(msg){
  const div = document.createElement('div');
  div.className = 'toast align-items-center text-bg-dark border-0';
  div.setAttribute('role','alert');
  div.setAttribute('aria-live','assertive');
  div.setAttribute('aria-atomic','true');
  div.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  document.getElementById('confirmToast').appendChild(div);
  const bs = new bootstrap.Toast(div, { delay: 2000 });
  bs.show();
  div.addEventListener('hidden.bs.toast', ()=> div.remove());
}

showManageBtn.addEventListener('click', ()=>{
  manageSection.classList.toggle('d-none');
  listSection.classList.toggle('d-none');
});
