const SUPPORT_GROUP_NO = '722701192';

async function loadContent() {
  const response = await fetch('./data/site-content.json');
  if (!response.ok) {
    throw new Error('failed to load content');
  }
  return response.json();
}

function renderList(targetId, items) {
  const root = document.getElementById(targetId);
  if (!root) {
    return;
  }

  root.innerHTML = items.map((item) => `<li>${item}</li>`).join('');
}

function renderProblems(items) {
  const root = document.getElementById('problemGrid');
  root.innerHTML = items.map((item) => `
    <article class="problem-card">
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    </article>
  `).join('');
}

function renderFeatures(items) {
  const root = document.getElementById('featureGrid');
  root.innerHTML = items.map((item) => `
    <article class="feature-card">
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    </article>
  `).join('');
}

function renderFaq(items) {
  const root = document.getElementById('faqList');
  root.innerHTML = items.map((item) => `
    <article class="faq-item" data-keywords="${item.keywords.join(' ')}">
      <h3>${item.question}</h3>
      <p>${item.answer}</p>
    </article>
  `).join('');
}

function bindFaqSearch() {
  const input = document.getElementById('faqSearch');
  const items = Array.from(document.querySelectorAll('.faq-item'));
  if (!input) {
    return;
  }

  input.addEventListener('input', () => {
    const keyword = input.value.trim().toLowerCase();
    items.forEach((item) => {
      const text = `${item.textContent} ${item.dataset.keywords || ''}`.toLowerCase();
      item.style.display = !keyword || text.includes(keyword) ? '' : 'none';
    });
  });
}

function bindCopyButton() {
  const button = document.getElementById('copyGroupBtn');
  if (!button) {
    return;
  }

  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_GROUP_NO);
      const original = button.textContent;
      button.textContent = '已复制';
      setTimeout(() => {
        button.textContent = original;
      }, 1600);
    } catch (error) {
      alert(`请手动复制 QQ 群号：${SUPPORT_GROUP_NO}`);
    }
  });
}

async function init() {
  try {
    const content = await loadContent();
    renderList('audienceList', content.audience);
    renderProblems(content.problems);
    renderFeatures(content.features);
    renderList('flowList', content.flow);
    renderFaq(content.faq);
    bindFaqSearch();
    bindCopyButton();
  } catch (error) {
    console.error(error);
  }
}

init();
