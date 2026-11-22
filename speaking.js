// 말하기 문항: 한자는 음성 합성에만 사용하고 화면에는 표시하지 않습니다.
const speakingTopics = [
  { id: 'weekday', label: '1-1. 요일', han: '今天星期几？', pin: 'Jīntiān xīngqī jǐ?', meaning: '오늘은 무슨 요일인가요?' },
  { id: 'date', label: '1-2. 날짜', han: '今天几月几号？', pin: 'Jīntiān jǐ yuè jǐ hào?', meaning: '오늘은 몇 월 며칠인가요?' },
  { id: 'job', label: '2. 장래 희망', han: '你将来想当什么？', pin: 'Nǐ jiānglái xiǎng dāng shénme?', meaning: '장래에 무엇이 되고 싶나요?', prefix: ['我想当', 'Wǒ xiǎng dāng'], options: [
    ['가수', '歌手', 'gēshǒu'], ['교사', '老师', 'lǎoshī'], ['경찰', '警察', 'jǐngchá'], ['공무원', '公务员', 'gōngwùyuán'], ['과학자', '科学家', 'kēxuéjiā'], ['디자이너', '设计师', 'shèjìshī'] ] },
  { id: 'hobby', label: '3. 좋아하는 활동', han: '你喜欢做什么？', pin: 'Nǐ xǐhuan zuò shénme?', meaning: '무엇을 하는 것을 좋아하나요?', prefix: ['我喜欢', 'Wǒ xǐhuan'], options: [
    ['노래 부르기', '唱歌', 'chànggē'], ['책 읽기', '读书', 'dúshū'], ['영화 보기', '看电影', 'kàn diànyǐng'], ['운동하기', '运动', 'yùndòng'], ['SNS 하기', '玩儿SNS', 'wánr SNS'] ] },
  { id: 'mood', label: '4. 기분', han: '今天你心情怎么样？', pin: 'Jīntiān nǐ xīnqíng zěnmeyàng?', meaning: '오늘 기분이 어떤가요?', prefix: ['我很', 'Wǒ hěn'], options: [
    ['행복하다', '幸福', 'xìngfú'], ['슬프다', '悲伤', 'bēishāng'], ['외롭다', '孤单', 'gūdān'], ['속상하다', '伤心', 'shāngxīn'], ['즐겁다', '开心', 'kāixīn'], ['기쁘다', '高兴', 'gāoxìng'], ['편안하다', '舒服', 'shūfu'], ['긴장하다', '紧张', 'jǐnzhāng'] ] },
  { id: 'direction', label: '5. 길 안내', han: '请问，图书馆怎么走？', pin: 'Qǐngwèn, túshūguǎn zěnme zǒu?', meaning: '실례합니다. 도서관에 어떻게 가나요?', options: [
    ['계속 직진하기', '一直往前走。', 'Yìzhí wǎng qián zǒu.'],
    ['직진 후 사거리에서 좌회전', '一直往前走。到十字路口，往左拐。', 'Yìzhí wǎng qián zǒu. Dào shízì lùkǒu, wǎng zuǒ guǎi.'],
    ['직진 후 사거리에서 우회전', '一直往前走。到十字路口，往右拐。', 'Yìzhí wǎng qián zǒu. Dào shízì lùkǒu, wǎng yòu guǎi.'] ] }
];

const speakingPanel = document.createElement('section');
speakingPanel.id = 'speaking-panel';
speakingPanel.className = 'hidden p-5 space-y-4';
speakingPanel.setAttribute('aria-label', '중국어 말하기 연습');
tabsEl.before(speakingPanel);
const originalCard = tabsEl.nextElementSibling;
const originalNavigation = originalCard.nextElementSibling;
const originalFooter = tabsEl.parentElement.nextElementSibling;
const baseDate = new Date();
const dateValue = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;
let speakingSaved = {};
try { speakingSaved = JSON.parse(localStorage.getItem('cn_speaking_v1') || '{}') || {}; } catch (_) {}
const speaking = { queue: speakingTopics.map(t => t.id), index: 0, heard: false, revealed: false, selected: null, hint: false, busy: false, error: '', randomOptions: false, date: dateValue, dayOffset: 0, route: 1, place: 0, saved: speakingSaved };
const buttonClass = 'px-4 py-3 rounded-xl text-sm font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed';
const primaryClass = 'px-4 py-3 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed';
const places = [['도서관', '图书馆', 'túshūguǎn'], ['학교', '学校', 'xuéxiào'], ['PC방', '网吧', 'wǎngbā'], ['영화관', '电影院', 'diànyǐngyuàn']];
const dayWords = [['그제', '前天', 'Qiántiān'], ['어제', '昨天', 'Zuótiān'], ['오늘', '今天', 'Jīntiān'], ['내일', '明天', 'Míngtiān'], ['모레', '后天', 'Hòutiān']];

function stopAudio() {
  playbackVersion++;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  isPlaying = false;
  playBtn.disabled = false;
  playBtn.className = 'w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all shadow-xl active:scale-90 bg-red-500 text-white hover:bg-red-600';
  volumeIcon.classList.remove('animate-pulse');
  speaking.busy = false;
}
function setSpeakingVisibility(active) {
  speakingPanel.classList.toggle('hidden', !active);
  [tabsEl, originalCard, originalNavigation, originalFooter].forEach(el => el.classList.toggle('hidden', active));
}
modeButtons.speaking.addEventListener('click', () => setAppMode('speaking'));
tabsEl.addEventListener('click', stopAudio);

function saveSpeaking() {
  try { localStorage.setItem('cn_speaking_v1', JSON.stringify(speaking.saved)); } catch (_) {}
}
function currentSpeakingTopic() { return speakingTopics.find(t => t.id === speaking.queue[speaking.index]); }
function targetDate(offset = speaking.dayOffset) {
  const parts = speaking.date.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2], 12);
  date.setDate(date.getDate() + offset);
  return date;
}
function chineseNumber(n) {
  const han = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const pin = ['líng', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ'];
  if (n < 10) return [han[n], pin[n]];
  return [(n >= 20 ? han[Math.floor(n / 10)] : '') + '十' + (n % 10 ? han[n % 10] : ''), (n >= 20 ? pin[Math.floor(n / 10)] + ' ' : '') + 'shí' + (n % 10 ? ' ' + pin[n % 10] : '')];
}
function questionFor(topic) {
  if (topic.id === 'weekday') {
    const word = dayWords[speaking.dayOffset + 2];
    return { han: word[1] + '星期几？', pin: word[2] + ' xīngqī jǐ?', meaning: word[0] + '는 무슨 요일인가요?' };
  }
  if (topic.id === 'direction') {
    const place = places[speaking.place];
    return { han: `请问，${place[1]}怎么走？`, pin: `Qǐngwèn, ${place[2]} zěnme zǒu?`, meaning: `실례합니다. ${place[0]}에 어떻게 가나요?` };
  }
  return topic;
}
function answerFor(topic, selected) {
  if (topic.id === 'weekday') {
    const num = selected === 0 ? ['天', 'tiān'] : chineseNumber(selected);
    return { han: '星期' + num[0] + '。', pin: 'Xīngqī ' + num[1] + '.', kr: ['일', '월', '화', '수', '목', '금', '토'][selected] + '요일입니다.' };
  }
  if (topic.id === 'date') {
    const month = chineseNumber(selected.month), day = chineseNumber(selected.day);
    return { han: month[0] + '月' + day[0] + '号。', pin: month[1] + ' yuè ' + day[1] + ' hào.', kr: `${selected.month}월 ${selected.day}일입니다.` };
  }
  const item = topic.options[selected];
  const kr = topic.id === 'job' ? `장래 희망: ${item[0]}` : topic.id === 'hobby' ? `좋아하는 활동: ${item[0]}` : topic.id === 'mood' ? `나의 기분: ${item[0]}` : item[0];
  return { han: (topic.prefix ? topic.prefix[0] : '') + item[1] + (topic.prefix ? '。' : ''), pin: (topic.prefix ? topic.prefix[1] + ' ' : '') + item[2] + (topic.prefix ? '.' : ''), kr };
}
function expectedSelection(topic) {
  const date = targetDate(topic.id === 'weekday' ? speaking.dayOffset : 0);
  if (topic.id === 'weekday') return date.getDay();
  if (topic.id === 'date') return { month: date.getMonth() + 1, day: date.getDate() };
  if (topic.id === 'direction') return speaking.route;
  return speaking.selected;
}
function matchesExpected(topic) { return JSON.stringify(speaking.selected) === JSON.stringify(expectedSelection(topic)); }

function resetSpeakingQuestion() {
  stopAudio();
  Object.assign(speaking, { heard: false, revealed: false, selected: null, hint: false, error: '' });
}
function goToSituation(index) {
  if (index < 0 || index >= speaking.queue.length) return;
  speaking.index = index;
  resetSpeakingQuestion();
  renderSpeaking();
}
function randomizeSpeakingOptions() {
  const s = speaking, topic = currentSpeakingTopic();
  const pick = count => Math.floor(Math.random() * count);
  if (topic.id === 'weekday' || topic.id === 'date') {
    const year = Number(s.date.slice(0, 4));
    const month = pick(12) + 1;
    const day = pick(new Date(year, month, 0).getDate()) + 1;
    s.date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (topic.id === 'weekday') s.dayOffset = pick(5) - 2;
    s.selected = expectedSelection(topic);
  } else if (topic.id === 'direction') {
    s.place = pick(places.length);
    s.route = pick(topic.options.length);
    s.selected = s.route;
  } else s.selected = pick(topic.options.length);
}
async function speakPractice(kind, slow = false) {
  stopAudio();
  const token = playbackVersion;
  const topic = currentSpeakingTopic();
  const text = kind === 'question' ? questionFor(topic).han : answerFor(topic, kind === 'correct' ? expectedSelection(topic) : speaking.selected).han;
  speaking.error = '';
  if (!('speechSynthesis' in window)) {
    speaking.error = '이 브라우저에서는 음성 재생을 지원하지 않습니다. 다른 브라우저에서 열어 주세요.';
    renderSpeaking(); return;
  }
  speaking.busy = true;
  renderSpeaking();
  const voice = await getChineseVoice();
  if (token !== playbackVersion) return;
  if (!voice) {
    speaking.busy = false;
    speaking.error = '중국어 음성을 찾지 못했습니다. 기기의 중국어 음성을 설치한 뒤 다시 들어 주세요.';
    renderSpeaking(); return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = slow ? 0.65 : 0.85;
  utterance.onend = () => {
    if (token !== playbackVersion) return;
    speaking.busy = false;
    if (kind === 'question') speaking.heard = true;
    else speaking.revealed = true;
    renderSpeaking();
  };
  utterance.onerror = () => {
    if (token !== playbackVersion) return;
    speaking.busy = false;
    speaking.error = '음성을 재생하지 못했습니다. 듣기 버튼을 눌러 다시 시도해 주세요.';
    renderSpeaking();
  };
  speechSynthesis.speak(utterance);
}

function renderSpeaking() {
  const s = speaking;
  const option = (value, text, selected) => `<option value="${value}" ${selected ? 'selected' : ''}>${text}</option>`;
  const btn = (action, text, disabled = false, primary = false) => `<button type="button" data-action="${action}" class="${primary ? primaryClass : buttonClass}" ${disabled ? 'disabled' : ''}>${text}</button>`;
  const topic = currentSpeakingTopic();
  const q = questionFor(topic);
  let controls = '';
  if (['weekday', 'date'].includes(topic.id)) {
    controls = `<label class="block text-sm font-bold">오늘의 기준 날짜<input id="sp-date" type="date" value="${s.date}" class="block w-full border rounded-xl p-3 mt-2"></label>`;
    if (topic.id === 'weekday') controls += `<label class="block text-sm font-bold">질문할 날<select id="sp-offset" class="block w-full border rounded-xl p-3 mt-2">${dayWords.map((d, i) => option(i - 2, d[0], s.dayOffset === i - 2)).join('')}</select></label>`;
  } else if (topic.id === 'direction') {
    controls = `<label class="block text-sm font-bold">목적지<select id="sp-place" class="block w-full border rounded-xl p-3 mt-2">${places.map((p, i) => option(i, p[0], s.place === i)).join('')}</select></label><label class="block text-sm font-bold">연습할 경로<select id="sp-route" class="block w-full border rounded-xl p-3 mt-2">${['직진', '직진 후 좌회전', '직진 후 우회전'].map((p, i) => option(i, p, s.route === i)).join('')}</select></label>`;
  }
  let choices = '';
  {
    if (topic.id === 'date') {
      const selected = s.selected || {};
      choices = `<div class="flex gap-2"><label class="flex-1">월<select id="sp-month" class="w-full border rounded-xl p-3"><option value="">선택</option>${Array.from({length: 12}, (_, i) => option(i + 1, `${i + 1}월`, selected.month === i + 1)).join('')}</select></label><label class="flex-1">일<select id="sp-day" class="w-full border rounded-xl p-3"><option value="">선택</option>${Array.from({length: selected.month ? new Date(Number(s.date.slice(0, 4)), selected.month, 0).getDate() : 31}, (_, i) => option(i + 1, `${i + 1}일`, selected.day === i + 1)).join('')}</select></label></div>`;
    } else {
      const items = topic.id === 'weekday' ? ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'] : topic.options.map(o => o[0]);
      choices = `<div class="grid grid-cols-2 gap-2">${items.map((label, i) => `<button data-choice="${i}" aria-pressed="${s.selected === i}" class="${buttonClass} ${s.selected === i ? 'ring-2 ring-red-400 bg-red-50' : ''}">${label}</button>`).join('')}</div>`;
    }
  }
  const ready = s.selected !== null && (topic.id !== 'date' || (s.selected.month && s.selected.day));
  let answer = '';
  if (s.revealed && ready) {
    const a = answerFor(topic, s.selected);
    answer = `<div class="bg-red-50 rounded-2xl p-4 space-y-3"><h3 class="font-bold text-sm">선택한 내용의 예시 답안</h3><p class="text-xl text-red-600 font-bold break-words">${a.pin}</p><p class="text-sm">${a.kr}</p><div class="flex flex-wrap gap-2">${btn('answer', '답안 다시 듣기', s.busy)}${btn('slow', '천천히 듣기', s.busy)}</div>`;
    if (!matchesExpected(topic)) {
      const correct = answerFor(topic, expectedSelection(topic));
      answer += `<div class="border-t border-red-200 pt-3 text-sm space-y-2"><p>선택한 내용이 ${topic.id === 'direction' ? '제시된 경로' : '기준 날짜'}와 달라요. 이 문제에 맞는 답은 다음과 같아요.</p><p>${correct.kr}</p><p class="font-bold">${correct.pin}</p>${btn('correct', '맞는 답안 듣기', s.busy)}</div>`;
    } else if (['date', 'weekday', 'direction'].includes(topic.id)) answer += '<p class="text-sm text-green-700">선택한 내용이 문제와 일치해요. 발음도 직접 비교해 보세요.</p>';
    answer += `</div><div class="flex flex-col gap-2">${btn('repeat', '답안 가리고 다시 말하기', s.busy)}<p class="text-xs text-slate-500">다른 한국어 답변을 골라 같은 질문으로 계속 연습할 수도 있어요.</p></div><p class="text-sm font-bold">이 상황을 얼마나 익혔나요? 체크해도 다음으로 넘어가지 않아요.</p><div class="grid grid-cols-2 gap-2">${btn('good', '이제 할 수 있어요', s.busy, true)}${btn('again', '더 연습할래요', s.busy)}</div>`;
  }
  speakingPanel.innerHTML = `<div class="flex justify-between items-center text-sm"><h2 class="font-bold">${topic.label}</h2><span>${s.index + 1} / ${s.queue.length}</span></div>
    <div class="flex flex-wrap gap-2" aria-label="연습 상황">${speakingTopics.map((t, i) => `<button data-situation="${i}" aria-pressed="${s.index === i}" class="px-3 py-2 rounded-xl text-xs border ${s.index === i ? 'bg-red-50 border-red-400 text-red-600' : 'bg-white border-slate-200 text-slate-600'}">${t.label}${s.saved[t.id] === 'good' ? ' ✓' : ''}</button>`).join('')}</div>
    <p class="text-sm text-slate-500">이 상황에서 내용을 바꿔가며 충분히 연습하세요. 준비가 되면 다음 상황으로 넘어가세요.</p>
    <label class="flex items-center gap-2 text-sm font-bold"><input id="sp-random-options" type="checkbox" ${s.randomOptions ? 'checked' : ''}> 옵션 랜덤</label>
    <p class="text-xs text-slate-500">${s.randomOptions ? '질문 듣기를 누를 때마다 이 상황의 옵션과 한국어 답변을 무작위로 정해요.' : '아래 옵션과 한국어 답변을 고른 뒤 질문 듣기를 눌러 주세요.'}</p>
    <fieldset class="space-y-3 disabled:opacity-60" ${s.randomOptions ? 'disabled' : ''}><legend class="sr-only">질문과 답변 옵션</legend>
    ${controls ? `<div class="bg-slate-50 rounded-xl p-4 space-y-3">${controls}<p class="text-xs text-slate-500">내용을 바꾸면 답안이 숨겨져요. 질문을 다시 듣고 연습하세요.</p></div>` : ''}
    <h3 class="font-bold text-sm">한국어로 답할 내용</h3>${choices}</fieldset>
    ${topic.id === 'direction' ? `<div class="bg-slate-100 rounded-xl p-4 text-center"><p class="text-xs">목적지: ${places[s.place][0]}</p><p class="text-3xl my-2" aria-label="${['직진', '직진 후 사거리에서 좌회전', '직진 후 사거리에서 우회전'][s.route]}">${['↑', '↑ → ✛ → ↰', '↑ → ✛ → ↱'][s.route]}</p><p class="text-xs">${s.route ? '✛ 사거리에서 방향을 바꾸세요' : '계속 앞으로 가세요'}</p></div>` : ''}
    <div class="bg-slate-50 rounded-2xl p-4 space-y-3"><p class="font-bold" role="status">${s.busy ? '중국어 음성을 듣고 있어요…' : s.heard ? '선택한 내용을 중국어로 말해 보세요.' : '옵션을 정한 뒤 중국어 질문을 들어 주세요.'}</p><div class="flex flex-wrap gap-2">${btn('question', s.heard ? '질문 다시 듣기' : '질문 듣기', s.busy || (!ready && !s.randomOptions), true)}${btn('question-slow', '질문 천천히 듣기', s.busy || (!ready && !s.randomOptions))}${btn('hint', s.hint ? '힌트 닫기' : '질문 힌트')}</div>${s.hint ? `<p class="text-red-600 font-bold">${q.pin}</p><p class="text-sm">${q.meaning}</p>` : ''}</div>
    ${s.error ? `<p role="alert" class="bg-amber-50 text-amber-800 rounded-xl p-3 text-sm">${s.error}</p>` : ''}
    ${s.heard && ready && !s.revealed ? `<div class="bg-blue-50 rounded-xl p-4 space-y-3"><p class="font-bold text-sm">선택한 내용을 중국어로 직접 말해 보세요.</p><p class="text-xs text-slate-600">다 말한 다음 아래 버튼을 눌러 비교하세요.</p>${btn('answer', '말했어요 · 답안 듣기', s.busy, true)}</div>` : ''}
    ${answer}
    ${s.saved[topic.id] ? `<p role="status" class="text-sm text-green-700">내 체크: ${s.saved[topic.id] === 'good' ? '이제 할 수 있어요 ✓' : '더 연습하는 중'} · 계속 반복해도 좋아요.</p>` : ''}
    <div class="grid grid-cols-2 gap-2 border-t pt-4">${btn('previous', '이전 상황', s.index === 0)}${btn('next', '다음 상황 →', s.index === s.queue.length - 1, true)}</div>
    ${s.index === s.queue.length - 1 ? '<p class="text-xs text-slate-500">마지막 상황이에요. 계속 연습하거나 위에서 다시 연습할 상황을 골라 주세요.</p>' : ''}`;
}

speakingPanel.addEventListener('change', e => {
  const el = e.target, s = speaking;
  if (el.id === 'sp-random-options') {
    stopAudio(); s.randomOptions = el.checked; s.heard = false; s.revealed = false; s.hint = false; renderSpeaking(); return;
  }
  if (['sp-date', 'sp-offset', 'sp-place', 'sp-route'].includes(el.id)) {
    if (el.id === 'sp-date') s.date = el.value || dateValue;
    if (el.id === 'sp-offset') s.dayOffset = Number(el.value);
    if (el.id === 'sp-place') s.place = Number(el.value);
    if (el.id === 'sp-route') s.route = Number(el.value);
    resetSpeakingQuestion();
    renderSpeaking();
    return;
  }
  if (el.id === 'sp-month' || el.id === 'sp-day') {
    stopAudio();
    s.selected = { month: Number(document.getElementById('sp-month').value), day: Number(document.getElementById('sp-day').value) };
    if (s.selected.month && s.selected.day > new Date(Number(s.date.slice(0, 4)), s.selected.month, 0).getDate()) s.selected.day = 0;
    s.heard = false;
    s.revealed = false;
    renderSpeaking();
  }
});
speakingPanel.addEventListener('click', e => {
  const el = e.target.closest('button');
  if (!el || el.disabled) return;
  const s = speaking;
  if (el.dataset.situation !== undefined) { goToSituation(Number(el.dataset.situation)); return; }
  if (el.dataset.choice !== undefined) {
    stopAudio(); s.selected = Number(el.dataset.choice); s.heard = false; s.revealed = false; renderSpeaking(); return;
  }
  const action = el.dataset.action;
  if (action === 'previous') goToSituation(s.index - 1);
  else if (action === 'next') goToSituation(s.index + 1);
  else if (action === 'repeat') {
    stopAudio(); s.heard = false; s.revealed = false; s.hint = false; s.error = ''; renderSpeaking();
  }
  else if (action === 'hint') { s.hint = !s.hint; renderSpeaking(); }
  else if (['question', 'question-slow', 'answer', 'correct', 'slow'].includes(action)) {
    if (action === 'question' || action === 'question-slow') {
      s.heard = false; s.revealed = false;
      if (s.randomOptions) { s.hint = false; randomizeSpeakingOptions(); }
    }
    speakPractice(action === 'slow' ? 'answer' : action === 'question-slow' ? 'question' : action, action === 'slow' || action === 'question-slow');
  }
  else if (action === 'good' || action === 'again') {
    s.saved[s.queue[s.index]] = action === 'good' ? 'good' : 'retry';
    saveSpeaking();
    renderSpeaking();
  }
});
