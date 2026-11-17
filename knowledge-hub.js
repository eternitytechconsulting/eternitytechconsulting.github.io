import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3/+esm';

// Public browser configuration. Keep RLS enabled in Supabase.
const SUPABASE_URL = 'https://rubhxqcshtactoduulcl.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cYuMEWqIZRfnOLdR6lQCKQ_uZOB77Bc';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const postsRoot = document.getElementById('knowledgePosts');
const editor = document.getElementById('knowledgeEditor');
const message = document.getElementById('knowledgeMessage');
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
let allPosts = [];
let isAdmin = false;

const cleanArticle = html => DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'h2', 'h3', 'blockquote', 'pre', 'code', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false
});
const make = (tag, className = '', text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
};
const setMessage = (text, error = false) => {
  if (!message) return;
  message.textContent = text;
  message.style.color = error ? '#b42318' : '#16834b';
};

function openKnowledgeEditor() {
  if (!editor) return;
  editor.hidden = false;
  editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function closeKnowledgeEditor() {
  if (!editor) return;
  editor.hidden = true;
  setMessage('');
}
function formatKnowledge(command) {
  const content = document.getElementById('postContent');
  if (!content) return;
  content.focus();
  document.execCommand(command, false, null);
}
function filterKnowledgePosts(term) {
  const q = String(term || '').toLowerCase();
  renderPosts(allPosts.filter(post => `${post.title} ${post.author} ${post.content_html}`.toLowerCase().includes(q)));
}
window.openKnowledgeEditor = openKnowledgeEditor;
window.closeKnowledgeEditor = closeKnowledgeEditor;
window.formatKnowledge = formatKnowledge;
window.filterKnowledgePosts = filterKnowledgePosts;

async function loadAdminState() {
  const { data: { session } } = await supabase.auth.getSession();
  isAdmin = false;
  if (session?.user) {
    const { data, error } = await supabase.from('knowledge_admins')
      .select('user_id').eq('user_id', session.user.id).maybeSingle();
    isAdmin = !error && !!data;
  }
  renderAdminTools();
}
function renderAdminTools() {
  if (!postsRoot?.parentElement) return;
  let area = document.getElementById('knowledgeAdminTools');
  if (!area) {
    area = make('div');
    area.id = 'knowledgeAdminTools';
    area.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;align-items:center;flex-wrap:wrap;margin:12px 0;';
    postsRoot.parentElement.insertBefore(area, postsRoot);
  }
  area.replaceChildren();
  const button = make('button', 'knowledge-cancel', isAdmin ? 'Admin: Sign out' : 'Admin login');
  button.type = 'button';
  button.addEventListener('click', adminButtonAction);
  area.append(button);
  if (isAdmin) area.append(make('span', '', 'Admin controls enabled'));
}
async function adminButtonAction() {
  if (isAdmin) {
    const { error } = await supabase.auth.signOut();
    if (error) window.alert(error.message);
    await loadAdminState();
    renderPosts(allPosts);
    return;
  }
  const email = window.prompt('Admin email address:');
  if (!email) return;
  const password = window.prompt('Admin password:');
  if (!password) return;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    window.alert('Login failed: ' + error.message);
    return;
  }
  await loadAdminState();
  if (!isAdmin) {
    await supabase.auth.signOut();
    await loadAdminState();
    window.alert('This account is not registered as a Knowledge Hub admin. Add its Auth user ID to the knowledge_admins table first.');
    return;
  }
  renderPosts(allPosts);
}

async function publishKnowledgePost() {
  const author = document.getElementById('postAuthor')?.value.trim();
  const title = document.getElementById('postTitle')?.value.trim();
  const contentNode = document.getElementById('postContent');
  const content = cleanArticle(contentNode?.innerHTML || '');
  const file = document.getElementById('postImage')?.files?.[0];
  if (!author || !title || !contentNode?.innerText.trim()) {
    setMessage('Please enter your name, article title and content.', true);
    return;
  }
  if (author.length > 60 || title.length > 150) {
    setMessage('Your name must be 60 characters or less and the title 150 characters or less.', true);
    return;
  }
  if (file && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > MAX_IMAGE_BYTES)) {
    setMessage('Choose a JPG, PNG or WebP image smaller than 5 MB.', true);
    return;
  }
  setMessage('Publishing your article...');
  let imagePath = null;
  if (file) {
    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    imagePath = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('knowledge-images').upload(imagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setMessage('Image upload failed: ' + uploadError.message, true);
      return;
    }
  }
  const { error } = await supabase.from('posts').insert({ author, title, content_html: content, image_path: imagePath });
  if (error) {
    if (imagePath) await supabase.storage.from('knowledge-images').remove([imagePath]);
    setMessage('Could not publish: ' + error.message, true);
    return;
  }
  document.getElementById('postAuthor').value = '';
  document.getElementById('postTitle').value = '';
  contentNode.innerHTML = '';
  const imageInput = document.getElementById('postImage');
  if (imageInput) imageInput.value = '';
  setMessage('Your article has been published!');
  await loadPosts();
  window.setTimeout(closeKnowledgeEditor, 1200);
}
window.publishKnowledgePost = publishKnowledgePost;

function publicImageUrl(path) {
  return path ? supabase.storage.from('knowledge-images').getPublicUrl(path).data.publicUrl : '';
}
function renderPosts(posts) {
  if (!postsRoot) return;
  postsRoot.replaceChildren();
  if (!posts.length) {
    postsRoot.append(make('div', 'knowledge-loading', 'No articles found yet. Be the first to publish!'));
    return;
  }
  for (const post of posts) {
    const card = make('article', 'knowledge-card');
    const header = make('div', 'knowledge-card-header');
    header.append(make('h3', '', post.title), make('p', '', `By ${post.author} · ${new Date(post.created_at).toLocaleString()}`));
    card.append(header);
    if (post.image_path) {
      const img = document.createElement('img');
      img.src = publicImageUrl(post.image_path);
      img.alt = `Image attached to ${post.title}`;
      img.loading = 'lazy';
      img.style.cssText = 'max-width:100%;height:auto;border-radius:12px;margin:12px 0;';
      card.append(img);
    }
    const articleBody = make('div', 'knowledge-card-content');
    articleBody.innerHTML = cleanArticle(post.content_html);
    card.append(articleBody);
    if (isAdmin) {
      const removePost = make('button', 'knowledge-cancel', 'Delete article');
      removePost.type = 'button';
      removePost.addEventListener('click', () => deleteArticle(post));
      card.append(removePost);
    }
    const commentsSection = make('div', 'knowledge-comments');
    commentsSection.style.cssText = 'border-top:1px solid #e2e8f0;margin-top:16px;padding-top:12px;';
    commentsSection.append(make('h4', '', 'Comments'));
    const commentList = make('div', 'knowledge-comment-list');
    for (const comment of (post.comments || [])) {
      const item = make('div', 'knowledge-comment');
      item.style.cssText = 'padding:8px 0;border-bottom:1px solid #e8edf3;';
      item.append(make('p', '', `${comment.author}: ${comment.body}`));
      if (isAdmin) {
        const removeComment = make('button', 'knowledge-cancel', 'Delete');
        removeComment.type = 'button';
        removeComment.addEventListener('click', () => deleteComment(comment.id));
        item.append(removeComment);
      }
      commentList.append(item);
    }
    commentsSection.append(commentList);
    const form = make('form', 'knowledge-comment-form');
    form.style.cssText = 'display:grid;gap:8px;margin-top:12px;';
    const name = make('input');
    name.type = 'text'; name.maxLength = 60; name.required = true; name.placeholder = 'Your name';
    const body = make('textarea');
    body.maxLength = 1000; body.required = true; body.rows = 2; body.placeholder = 'Write a comment...';
    const submit = make('button', 'knowledge-primary', 'Post comment');
    submit.type = 'submit';
    form.append(name, body, submit);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const commentAuthor = name.value.trim();
      const commentBody = body.value.trim();
      if (!commentAuthor || !commentBody) return;
      submit.disabled = true;
      const { error } = await supabase.from('comments').insert({ post_id: post.id, author: commentAuthor, body: commentBody });
      submit.disabled = false;
      if (error) window.alert('Could not post comment: ' + error.message);
      else await loadPosts();
    });
    commentsSection.append(form);
    card.append(commentsSection);
    postsRoot.append(card);
  }
}

async function deleteArticle(post) {
  if (!isAdmin || !window.confirm('Delete this article and its comments?')) return;
  const { error } = await supabase.from('posts').delete().eq('id', post.id);
  if (error) {
    window.alert('Delete failed: ' + error.message);
    return;
  }
  if (post.image_path) {
    const { error: imageError } = await supabase.storage.from('knowledge-images').remove([post.image_path]);
    if (imageError) window.alert('Article deleted, but its image could not be removed: ' + imageError.message);
  }
  await loadPosts();
}
async function deleteComment(id) {
  if (!isAdmin || !window.confirm('Delete this comment?')) return;
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) window.alert('Delete failed: ' + error.message);
  else await loadPosts();
}
async function loadPosts() {
  if (!postsRoot) return;
  postsRoot.replaceChildren(make('div', 'knowledge-loading', 'Loading community articles...'));
  const { data: posts, error } = await supabase.from('posts')
    .select('id, author, title, content_html, image_path, created_at').order('created_at', { ascending: false });
  if (error) {
    postsRoot.textContent = `Could not load articles: ${error.message}. Please run the supplied Supabase SQL setup.`;
    return;
  }
  const ids = (posts || []).map(post => post.id);
  let comments = [];
  if (ids.length) {
    const { data, error: commentsError } = await supabase.from('comments')
      .select('id, post_id, author, body, created_at').in('post_id', ids).order('created_at', { ascending: true });
    if (commentsError) {
      postsRoot.textContent = `Articles loaded, but comments could not be loaded: ${commentsError.message}`;
      return;
    }
    comments = data || [];
  }
  allPosts = (posts || []).map(post => ({ ...post, comments: comments.filter(comment => comment.post_id === post.id) }));
  renderPosts(allPosts);
}

supabase.auth.onAuthStateChange(() => {
  window.setTimeout(async () => {
    await loadAdminState();
    renderPosts(allPosts);
  }, 0);
});

document.addEventListener('DOMContentLoaded', async () => {
  if (!postsRoot) return;
  await loadAdminState();
  await loadPosts();
});
