
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.2.6/+esm';

// SUPABASE CONNECTION
const SUPABASE_URL = 'https://rubhxqcshtactoduulcl.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cYuMEWqIZRfnOLdR6lQCKQ_uZOB77Bc';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const BUCKET = 'knowledge-images';

const $ = (id) => document.getElementById(id);

let cachedPosts = [];
let isAdmin = false;
let currentUser = null;

// SECURITY HELPERS
function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function safeArticleHTML(html = '') {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'strong', 'i', 'em',
      'u', 'ul', 'ol', 'li', 'h2', 'h3',
      'blockquote', 'pre', 'code', 'a'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false
  });
}

function setMessage(message, isError = false) {
  const el = $('knowledgeMessage');
  if (el) {
    el.textContent = message;
    el.style.color = isError ? '#c62828' : '#16834a';
  }
}

function dateLabel(value) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

// OPEN AND CLOSE EDITOR
window.openKnowledgeEditor = () => {
  const editor = $('knowledgeEditor');

  if (editor) {
    editor.hidden = false;
    editor.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};

window.closeKnowledgeEditor = () => {
  const editor = $('knowledgeEditor');
  if (editor) editor.hidden = true;
};

// RICH TEXT FORMATTING
window.formatKnowledge = (command) => {
  const content = $('postContent');
  if (!content) return;

  content.focus();
  document.execCommand(command, false, null);
};

// SEARCH ARTICLES
window.filterKnowledgePosts = (query = '') => {
  renderPosts(query);
};

// IMAGE UPLOAD
async function uploadImage(file) {
  if (!file) return null;

  const allowed = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  if (!allowed.includes(file.type)) {
    throw new Error('Please choose a JPG, PNG or WEBP image.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size must be 5 MB or less.');
  }

  const extension =
    file.type === 'image/jpeg'
      ? 'jpg'
      : file.type.split('/')[1];

  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false
    });

  if (error) throw error;

  return path;
}

// PUBLISH ARTICLE
window.publishKnowledgePost = async () => {
  const author = $('postAuthor')?.value.trim() || '';
  const title = $('postTitle')?.value.trim() || '';
  const editor = $('postContent');

  const content = safeArticleHTML(editor?.innerHTML || '');
  const file = $('postImage')?.files?.[0] || null;

  if (!author || !title || !editor?.innerText.trim()) {
    return setMessage(
      'Please enter your name, article title and content.',
      true
    );
  }

  if (author.length > 60 || title.length > 150) {
    return setMessage(
      'Name must be 60 characters or less and title 150 characters or less.',
      true
    );
  }

  if (content.length > 50000) {
    return setMessage(
      'Article content is too long (maximum 50,000 characters).',
      true
    );
  }

  const button = document.querySelector(
    '#knowledgeEditor .knowledge-form-actions button'
  );

  if (button) {
    button.disabled = true;
    button.textContent = 'Publishing...';
  }

  let imagePath = null;

  try {
    imagePath = await uploadImage(file);

    const { error } = await supabase
      .from('posts')
      .insert({
        author,
        title,
        content_html: content,
        image_path: imagePath
      });

    if (error) throw error;

    if ($('postTitle')) $('postTitle').value = '';
    if ($('postAuthor')) $('postAuthor').value = '';
    if (editor) editor.innerHTML = '';
    if ($('postImage')) $('postImage').value = '';

    window.closeKnowledgeEditor();

    setMessage('Your article has been published.');

    await loadPosts();

  } catch (error) {
    if (imagePath) {
      await supabase.storage
        .from(BUCKET)
        .remove([imagePath]);
    }

    setMessage(
      error.message || 'Could not publish your article. Please try again.',
      true
    );

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'Publish Article';
    }
  }
};

// LOAD ARTICLES
async function loadPosts() {
  const container = $('knowledgePosts');
  if (!container) return;

  container.innerHTML =
    '<div class="knowledge-loading">Loading community articles...</div>';

  const { data, error } = await supabase
    .from('posts')
    .select('id,author,title,content_html,image_path,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML =
      `<p class="knowledge-error">Could not load articles: ${escapeHTML(error.message)}. Check that the SQL setup has been run.</p>`;
    return;
  }

  cachedPosts = data || [];

  await renderPosts($('knowledgeSearch')?.value || '');
}

// DISPLAY ARTICLES AND COMMENTS
async function renderPosts(query = '') {
  const container = $('knowledgePosts');
  if (!container) return;

  const q = query.trim().toLowerCase();

  const posts = cachedPosts.filter(p =>
    `${p.title} ${p.author} ${p.content_html.replace(/<[^>]*>/g, ' ')}`
      .toLowerCase()
      .includes(q)
  );

  if (!posts.length) {
    container.innerHTML =
      `<div class="knowledge-empty">${
        cachedPosts.length
          ? 'No articles match your search.'
          : 'No articles yet. Be the first to share your knowledge!'
      }</div>`;
    return;
  }

  const ids = posts.map(p => p.id);

  const { data: comments, error } = await supabase
    .from('comments')
    .select('id,post_id,author,body,created_at')
    .in('post_id', ids)
    .order('created_at', { ascending: true });

  if (error) {
    container.innerHTML =
      `<p class="knowledge-error">Could not load comments: ${escapeHTML(error.message)}</p>`;
    return;
  }

  const grouped = new Map();

  (comments || []).forEach(c => {
    if (!grouped.has(c.post_id)) {
      grouped.set(c.post_id, []);
    }

    grouped.get(c.post_id).push(c);
  });

  container.innerHTML = posts.map(p => {
    const image = p.image_path
      ? supabase.storage.from(BUCKET).getPublicUrl(p.image_path).data.publicUrl
      : '';

    const postComments = grouped.get(p.id) || [];

    return `
      <article class="knowledge-card" data-post-id="${p.id}">

        <div class="knowledge-post-meta">
          <strong>${escapeHTML(p.author)}</strong>
          <span>${escapeHTML(dateLabel(p.created_at))}</span>
        </div>

        <h3>${escapeHTML(p.title)}</h3>

        ${
          image
            ? `<img class="knowledge-post-image"
                src="${escapeHTML(image)}"
                alt="Article image"
                loading="lazy">`
            : ''
        }

        <div class="knowledge-post-body">
          ${safeArticleHTML(p.content_html)}
        </div>

        ${
          isAdmin
            ? `<button type="button"
                class="knowledge-admin-delete"
                data-delete-post="${p.id}">
                Delete article
              </button>`
            : ''
        }

        <div class="knowledge-comments">

          <h4>Comments (${postComments.length})</h4>

          <div class="knowledge-comment-list">

            ${
              postComments.map(c => `
                <div class="knowledge-comment">
                  <strong>${escapeHTML(c.author)}</strong>
                  <p>${escapeHTML(c.body)}</p>
                  <small>${escapeHTML(dateLabel(c.created_at))}</small>

                  ${
                    isAdmin
                      ? `<button type="button"
                          class="knowledge-admin-delete"
                          data-delete-comment="${c.id}">
                          Delete
                        </button>`
                      : ''
                  }
                </div>
              `).join('')
              || '<p class="knowledge-no-comments">Be the first to comment.</p>'
            }

          </div>

          <form class="knowledge-comment-form"
            data-comment-form="${p.id}">

            <input
              name="author"
              maxlength="60"
              placeholder="Your name"
              required>

            <textarea
              name="body"
              maxlength="2000"
              rows="2"
              placeholder="Write a comment..."
              required></textarea>

            <button type="submit">Post comment</button>

          </form>

        </div>

      </article>
    `;
  }).join('');
}

// POST COMMENTS
$('knowledgePosts')?.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-comment-form]');
  if (!form) return;

  event.preventDefault();

  const data = new FormData(form);

  const author = String(data.get('author') || '').trim();
  const body = String(data.get('body') || '').trim();
  const postId = form.dataset.commentForm;

  if (!author || !body) return;

  const button = form.querySelector('button');
  button.disabled = true;

  const { error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author,
      body
    });

  if (error) {
    alert(`Could not post comment: ${error.message}`);
  }

  await renderPosts($('knowledgeSearch')?.value || '');
});

// ADMIN DELETE CONTROLS
$('knowledgePosts')?.addEventListener('click', async (event) => {
  const postButton = event.target.closest('[data-delete-post]');
  const commentButton = event.target.closest('[data-delete-comment]');

  if (!isAdmin) return;

  if (postButton && confirm('Delete this article and all its comments?')) {
    const post = cachedPosts.find(
      p => p.id === postButton.dataset.deletePost
    );

    if (post?.image_path) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([post.image_path]);

      if (storageError) {
        alert(`Image could not be removed: ${storageError.message}`);
        return;
      }
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postButton.dataset.deletePost);

    if (error) {
      alert(`Delete failed: ${error.message}`);
    }

    await loadPosts();

  } else if (
    commentButton &&
    confirm('Delete this comment?')
  ) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentButton.dataset.deleteComment);

    if (error) {
      alert(`Delete failed: ${error.message}`);
    }

    await renderPosts($('knowledgeSearch')?.value || '');
  }
});

// ADMIN LOGIN PANEL
function ensureAdminPanel() {
  const section = $('knowledge');

  if (!section || $('knowledgeAdminPanel')) return;

  const panel = document.createElement('div');

  panel.id = 'knowledgeAdminPanel';
  panel.className = 'knowledge-admin-panel';

  panel.innerHTML = `
    <button type="button" id="knowledgeAdminToggle">
      Admin login
    </button>

    <form id="knowledgeAdminForm" hidden>
      <input name="email"
        type="email"
        placeholder="Admin email"
        required>

      <input name="password"
        type="password"
        placeholder="Password"
        required>

      <button type="submit">Sign in</button>

      <button type="button" id="knowledgeAdminCancel">
        Cancel
      </button>

      <p id="knowledgeAdminMessage" aria-live="polite"></p>
    </form>

    <button type="button" id="knowledgeAdminLogout" hidden>
      Admin logout
    </button>
  `;

  section.append(panel);

  $('knowledgeAdminToggle').addEventListener('click', () => {
    $('knowledgeAdminForm').hidden = false;
  });

  $('knowledgeAdminCancel').addEventListener('click', () => {
    $('knowledgeAdminForm').hidden = true;
  });

  $('knowledgeAdminForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const fd = new FormData(event.currentTarget);

    const { error } = await supabase.auth.signInWithPassword({
      email: fd.get('email'),
      password: fd.get('password')
    });

    $('knowledgeAdminMessage').textContent =
      error ? error.message : 'Signed in. Checking admin access...';

    if (!error) await refreshAdmin();
  });

  $('knowledgeAdminLogout').addEventListener('click', async () => {
    await supabase.auth.signOut();
    await refreshAdmin();
  });
}

// CHECK ADMIN PERMISSIONS
async function refreshAdmin() {
  const { data: sessionData } = await supabase.auth.getSession();

  currentUser = sessionData.session?.user || null;
  isAdmin = false;

  if (currentUser) {
    const { data } = await supabase
      .from('knowledge_admins')
      .select('user_id')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    isAdmin = !!data;
  }

  if ($('knowledgeAdminToggle')) {
    $('knowledgeAdminToggle').hidden = isAdmin;
  }

  if ($('knowledgeAdminForm')) {
    $('knowledgeAdminForm').hidden = true;
  }

  if ($('knowledgeAdminLogout')) {
    $('knowledgeAdminLogout').hidden = !isAdmin;
  }

  if (
    currentUser &&
    !isAdmin &&
    $('knowledgeAdminMessage')
  ) {
    $('knowledgeAdminMessage').textContent =
      'This account is not registered as a Knowledge Hub admin.';
  }

  await renderPosts($('knowledgeSearch')?.value || '');
}

// INITIALIZE KNOWLEDGE HUB
supabase.auth.onAuthStateChange(() => {
  setTimeout(refreshAdmin, 0);
});

ensureAdminPanel();
loadPosts();
refreshAdmin();
