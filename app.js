// app.js
document.addEventListener('DOMContentLoaded', () => {
    fetchArticles();
});

const feedView = document.getElementById('feed-view');
const articleView = document.getElementById('article-view');
const loader = document.getElementById('loader');

let articlesMap = {}; // store fetched articles

function fetchArticles() {
    const articlesRef = db.ref('articles').orderByChild('timestamp');
    
    articlesRef.once('value', (snapshot) => {
        loader.classList.add('hidden');
        feedView.classList.remove('hidden');
        
        const data = snapshot.val();
        if (!data) {
            feedView.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">No articles published yet.</p>';
            return;
        }

        // Convert object to array and sort descending
        const articles = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        })).sort((a, b) => b.timestamp - a.timestamp);

        articlesMap = {};
        feedView.innerHTML = '';

        articles.forEach(article => {
            articlesMap[article.id] = article;
            
            // Create a plain text snippet from HTML content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = article.content;
            const textContent = tempDiv.textContent || tempDiv.innerText || '';
            const snippet = textContent.substring(0, 150) + '...';

            const date = new Date(article.timestamp).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            const card = document.createElement('div');
            card.className = 'article-card';
            card.onclick = () => openArticle(article.id);
            card.innerHTML = `
                <h2 class="article-title">${article.title}</h2>
                <div class="article-meta">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span>${article.author}</span>
                    <span>•</span>
                    <span>${date}</span>
                </div>
                <p class="article-snippet">${snippet}</p>
            `;
            feedView.appendChild(card);
        });
    });
}

function openArticle(id) {
    const article = articlesMap[id];
    if (!article) return;

    feedView.classList.add('hidden');
    articleView.classList.remove('hidden');
    window.scrollTo(0, 0);

    document.getElementById('view-title').textContent = article.title;
    document.getElementById('view-author').textContent = article.author;
    
    const date = new Date(article.timestamp).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('view-date').textContent = date;
    
    document.getElementById('view-content').innerHTML = article.content;
}

function showFeed() {
    articleView.classList.add('hidden');
    feedView.classList.remove('hidden');
}

// Navigation Auth State
const navLogin = document.getElementById('nav-login');
const navWrite = document.getElementById('nav-write');
const navLogout = document.getElementById('nav-logout');

auth.onAuthStateChanged(user => {
    if (user) {
        if(navLogin) navLogin.classList.add('hidden');
        if(navWrite) navWrite.classList.remove('hidden');
        if(navLogout) navLogout.classList.remove('hidden');
    } else {
        if(navLogin) navLogin.classList.remove('hidden');
        if(navWrite) navWrite.classList.add('hidden');
        if(navLogout) navLogout.classList.add('hidden');
    }
});

async function logout() {
    try {
        await auth.signOut();
        window.location.reload();
    } catch(error) {
        console.error('Logout error:', error);
    }
}
