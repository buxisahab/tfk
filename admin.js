// admin.js
const authPanel = document.getElementById('auth-panel');
const editorPanel = document.getElementById('editor-panel');
const loader = document.getElementById('loader');
const logoutBtn = document.getElementById('logout-btn');
const authForm = document.getElementById('auth-form');
const adminBanner = document.getElementById('admin-banner');
const manageArticlesList = document.getElementById('manage-articles-list');

const ADMIN_UID = 'WH3eGCvHoThyz8Jd0MShW5rpI6t1';

// Initialize Quill Editor
const quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image', 'video'],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        }
    }
});

// Custom Image Handler for Firebase Storage
function imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
        const file = input.files[0];
        if (file) {
            const range = quill.getSelection(true);
            showToast('Uploading image...');
            
            try {
                // Create unique filename
                const fileName = `images/${Date.now()}_${file.name}`;
                const storageRef = storage.ref(fileName);
                
                // Upload to Firebase
                const snapshot = await storageRef.put(file);
                const downloadURL = await snapshot.ref.getDownloadURL();
                
                // Insert into editor
                quill.insertEmbed(range.index, 'image', downloadURL);
                quill.setSelection(range.index + 1);
                showToast('Image uploaded successfully!');
            } catch (error) {
                console.error("Upload error:", error);
                showToast('Failed to upload image.', true);
            }
        }
    };
}

// Auth State Observer
auth.onAuthStateChanged(user => {
    loader.classList.add('hidden');
    if (user) {
        authPanel.classList.add('hidden');
        editorPanel.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        
        if (user.uid === ADMIN_UID) {
            adminBanner.classList.remove('hidden');
        } else {
            adminBanner.classList.add('hidden');
        }
        
        loadManageArticles(user);
    } else {
        authPanel.classList.remove('hidden');
        editorPanel.classList.add('hidden');
        logoutBtn.classList.add('hidden');
    }
});

// Login
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showToast('Logged in successfully!');
    } catch (error) {
        showToast(error.message, true);
    }
});

// Signup
async function signup() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if(!email || !password) {
        showToast('Please enter email and password.', true);
        return;
    }

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        showToast('Account created successfully!');
    } catch (error) {
        showToast(error.message, true);
    }
}

// Logout
async function logout() {
    try {
        await auth.signOut();
        showToast('Logged out.');
    } catch (error) {
        showToast(error.message, true);
    }
}

// Publish Article
async function publishArticle() {
    const title = document.getElementById('article-title').value.trim();
    const author = document.getElementById('article-author').value.trim();
    const content = quill.root.innerHTML;
    
    // Basic validation
    if (!title || !author || quill.getText().trim().length === 0) {
        showToast('Please fill out all fields.', true);
        return;
    }

    showToast('Publishing article...');

    try {
        const newArticleRef = db.ref('articles').push();
        await newArticleRef.set({
            title: title,
            author: author,
            content: content,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            userId: auth.currentUser.uid
        });

        // Clear form
        document.getElementById('article-title').value = '';
        quill.setContents([]);
        showToast('Article published successfully!');
        
        // Optional: Redirect to home after short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        showToast('Failed to publish: ' + error.message, true);
    }
}

function loadManageArticles(user) {
    const articlesRef = db.ref('articles').orderByChild('timestamp');
    articlesRef.on('value', (snapshot) => {
        manageArticlesList.innerHTML = '';
        const data = snapshot.val();
        if (!data) {
            manageArticlesList.innerHTML = '<p style="color: var(--text-secondary);">No articles found.</p>';
            return;
        }
        
        const articles = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        })).sort((a, b) => b.timestamp - a.timestamp);

        articles.forEach(article => {
            // Show if admin OR if user is the author
            if (user.uid === ADMIN_UID || article.userId === user.uid) {
                const div = document.createElement('div');
                div.style.padding = '1rem';
                div.style.borderBottom = '1px solid var(--border-color)';
                div.style.display = 'flex';
                div.style.justifyContent = 'space-between';
                div.style.alignItems = 'center';
                
                div.innerHTML = `
                    <div>
                        <h3 style="margin-bottom: 0.2rem; font-size: 1.1rem; color: var(--text-primary);">${article.title}</h3>
                        <small style="color: var(--text-secondary);">${new Date(article.timestamp).toLocaleDateString()}</small>
                    </div>
                    <button class="btn" style="background: #ef4444; padding: 0.4rem 0.8rem;" onclick="deleteArticle('${article.id}')">Delete</button>
                `;
                manageArticlesList.appendChild(div);
            }
        });
        
        if (manageArticlesList.children.length === 0) {
            manageArticlesList.innerHTML = '<p style="color: var(--text-secondary);">You have not published any articles yet.</p>';
        }
    });
}

async function deleteArticle(id) {
    if (confirm('Are you sure you want to delete this article?')) {
        try {
            await db.ref('articles/' + id).remove();
            showToast('Article deleted.');
        } catch(error) {
            showToast('Error deleting: ' + error.message, true);
        }
    }
}

// Toast Utility
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#ef4444' : 'var(--accent-color)';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
