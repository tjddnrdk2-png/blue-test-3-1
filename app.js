const PAGE_SIZE = 18;
let reports = [];
let page = 1;

const news = [
  {title:'북부지방산림청, 양평 소나무재선충병 수종전환 방제 현장 점검',agency:'산림청',date:'2026.10.15',url:'https://www.korea.kr/briefing/pressReleaseView.do?newsId=156785357'},
  {title:'제주의 밭담, 수원에서 만나다...',agency:'농림축산식품부',date:'2026.10.15',url:'https://www.korea.kr/briefing/pressReleaseView.do?newsId=156785353'},
  {title:'중부지방산림청, 하천·계곡 불법시설 자진 철거 현장 점검',agency:'산림청',date:'2026.10.15',url:'https://www.korea.kr/briefing/pressReleaseView.do?newsId=156785355'},
  {title:'이형일 부총리, 日 가타야마 재무장관 면담에서 한일 통화스왑 연장에 합의',agency:'재정경제부',date:'2026.10.15',url:'https://www.korea.kr/briefing/pressReleaseView.do?newsId=156785351'},
  {title:'[보도자료] 생명지킴추진본부, 천명지킴 워크숍 개최',agency:'국무조정실',date:'2026.10.15',url:'https://www.korea.kr/briefing/pressReleaseView.do?newsId=156785352'},
  {title:'국제사이버협력대사, 제11차 싱가포르 국제사이버주간 참석 결과',agency:'외교부',date:'2026.10.15',url:'https://www.korea.kr/briefing/pressReleaseView.do?newsId=156785348'}
];

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function filteredReports(){
  const type = $('typeFilter').value;
  const status = $('statusFilter').value;
  return reports.filter(r => (!type || r.신고유형 === type) && (!status || r.처리상태 === status));
}

function renderCases(){
  const filtered = filteredReports();
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  page = Math.min(page, pages);
  $('resultCount').textContent = `결과 ${filtered.length.toLocaleString('ko-KR')}건`;
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  $('caseGrid').innerHTML = visible.length ? visible.map(r => {
    const statusClass = r.처리상태 === '처리완료' ? 'done' : r.처리상태 === '조사중' ? 'active' : '';
    return `<article class="case-card"><div class="case-top"><span class="case-id">${esc(r.사건ID)}</span><span class="status ${statusClass}">${esc(r.처리상태)}</span></div><h3>${esc(r.신고유형)}</h3><div class="case-meta"><div><span>신고일자</span><strong>${esc(r.신고일자)}</strong></div><div><span>지역</span><strong>${esc(r.지역)}</strong></div><div><span>신고자 유형</span><strong>${esc(r.신고자유형)}</strong></div><div><span>조치 결과</span><strong>${esc(r.조치결과)}</strong></div></div></article>`;
  }).join('') : '<p class="empty">조건에 맞는 신고 사건이 없습니다.</p>';
  renderPagination(pages);
}

function renderPagination(pages){
  if (pages <= 1) { $('pagination').innerHTML = ''; return; }
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  let html = `<button class="page-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="이전 페이지">‹</button>`;
  for(let n=start;n<=end;n++) html += `<button class="page-btn ${n === page ? 'active' : ''}" data-page="${n}">${n}</button>`;
  html += `<button class="page-btn" data-page="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="다음 페이지">›</button>`;
  $('pagination').innerHTML = html;
  $('pagination').querySelectorAll('[data-page]').forEach(btn => btn.addEventListener('click', () => { page = Number(btn.dataset.page); renderCases(); $('cases').scrollIntoView(); }));
}

function renderNews(){
  $('newsList').innerHTML = news.map(n => `<a class="news-item" href="${n.url}" target="_blank" rel="noopener"><span class="news-date">${n.date}</span><span class="news-title">${esc(n.title)}<span class="news-agency">${esc(n.agency)}</span></span><span class="news-arrow" aria-hidden="true">↗</span></a>`).join('');
}

async function init(){
  try{
    const [reportRes, eduRes] = await Promise.all([fetch('data/reports.json'), fetch('data/education.json')]);
    if(!reportRes.ok || !eduRes.ok) throw new Error('데이터를 불러오지 못했습니다.');
    [reports] = await Promise.all([reportRes.json(), eduRes.json().then(edu => {
      const rates = edu.map(x => x.교육이수율).filter(Number.isFinite);
      $('educationRate').textContent = (rates.reduce((a,b)=>a+b,0)/rates.length).toFixed(1);
      return edu;
    })]);
    $('totalCases').textContent = reports.length.toLocaleString('ko-KR');
    $('completeCases').textContent = reports.filter(r => r.처리상태 === '처리완료').length.toLocaleString('ko-KR');
    [...new Set(reports.map(r=>r.신고유형))].sort().forEach(v => $('typeFilter').insertAdjacentHTML('beforeend', `<option>${esc(v)}</option>`));
    [...new Set(reports.map(r=>r.처리상태))].sort().forEach(v => $('statusFilter').insertAdjacentHTML('beforeend', `<option>${esc(v)}</option>`));
    $('typeFilter').addEventListener('change', ()=>{page=1;renderCases()});
    $('statusFilter').addEventListener('change', ()=>{page=1;renderCases()});
    $('resetFilters').addEventListener('click', ()=>{$('typeFilter').value='';$('statusFilter').value='';page=1;renderCases()});
    renderCases();
  }catch(error){
    $('caseGrid').innerHTML = `<p class="empty">${esc(error.message)}</p>`;
  }
  renderNews();
}

init();
