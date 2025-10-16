// 用户评论和评分系统
// 提供评论、评分、收藏等交互功能

class CommentSystem {
    constructor() {
        this.comments = this.loadComments();
        this.ratings = this.loadRatings();
        this.favorites = this.loadFavorites();
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    init() {
        this.renderComments();
        this.renderRating();
        this.renderFavoriteButton();
        this.setupEventListeners();
    }

    getCurrentPage() {
        // 根据URL路径确定当前页面
        const path = window.location.pathname;
        if (path.includes('/database/units/')) {
            const characterName = document.querySelector('h1')?.textContent || 'unknown';
            return `character-${characterName.toLowerCase().replace(/\s+/g, '-')}`;
        }
        if (path.includes('/guides/')) {
            const guideName = document.querySelector('h1')?.textContent || 'unknown';
            return `guide-${guideName.toLowerCase().replace(/\s+/g, '-')}`;
        }
        if (path.includes('/tools/')) {
            return `tool-${path.split('/').pop().replace('.html', '')}`;
        }
        return 'homepage';
    }

    // 评论功能
    loadComments() {
        const saved = localStorage.getItem('animeRaidComments');
        return saved ? JSON.parse(saved) : {};
    }

    saveComments() {
        localStorage.setItem('animeRaidComments', JSON.stringify(this.comments));
    }

    addComment(username, content, rating = 0) {
        const comment = {
            id: Date.now(),
            username: username,
            content: content,
            rating: rating,
            timestamp: new Date().toISOString(),
            page: this.currentPage,
            likes: 0,
            replies: []
        };

        if (!this.comments[this.currentPage]) {
            this.comments[this.currentPage] = [];
        }

        this.comments[this.currentPage].unshift(comment);
        this.saveComments();
        this.renderComments();

        // 如果有评分，同时更新评分
        if (rating > 0) {
            this.updateRating(rating);
        }
    }

    renderComments() {
        const container = document.getElementById('comments-container');
        if (!container) return;

        const pageComments = this.comments[this.currentPage] || [];

        if (pageComments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p class="text-lg mb-2">No comments yet</p>
                    <p class="text-sm">Be the first to share your thoughts!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="space-y-4">
                ${pageComments.map(comment => this.renderComment(comment)).join('')}
            </div>
        `;

        // 添加交互事件
        this.attachCommentEvents();
    }

    renderComment(comment) {
        const date = new Date(comment.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        return `
            <div class="comment-item bg-white rounded-lg shadow p-4" data-comment-id="${comment.id}">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                            ${comment.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="font-semibold text-gray-900">${comment.username}</div>
                            <div class="text-sm text-gray-500">${formattedDate}</div>
                        </div>
                    </div>
                    ${comment.rating > 0 ? `
                        <div class="flex items-center">
                            ${this.renderStars(comment.rating, true)}
                        </div>
                    ` : ''}
                </div>
                <div class="text-gray-700 mb-3">${comment.content}</div>
                <div class="flex items-center space-x-4 text-sm">
                    <button class="like-button text-gray-500 hover:text-blue-600 transition-colors" data-comment-id="${comment.id}">
                        👍 <span class="like-count">${comment.likes}</span> Helpful
                    </button>
                    <button class="reply-button text-gray-500 hover:text-blue-600 transition-colors" data-comment-id="${comment.id}">
                        💬 Reply
                    </button>
                    <button class="share-button text-gray-500 hover:text-blue-600 transition-colors" data-comment-id="${comment.id}">
                        🔗 Share
                    </button>
                </div>
                <div class="reply-section hidden mt-3 pl-8" data-comment-id="${comment.id}">
                    <div class="flex space-x-2">
                        <input type="text" class="reply-input flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Write a reply...">
                        <button class="submit-reply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors" data-comment-id="${comment.id}">
                            Reply
                        </button>
                    </div>
                </div>
                ${comment.replies.length > 0 ? `
                    <div class="replies mt-3 pl-8 space-y-2">
                        ${comment.replies.map(reply => this.renderReply(reply)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderReply(reply) {
        const date = new Date(reply.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        return `
            <div class="bg-gray-50 rounded p-3" data-reply-id="${reply.id}">
                <div class="flex items-center mb-2">
                    <div class="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-2">
                        ${reply.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div class="font-semibold text-gray-900 text-sm">${reply.username}</div>
                        <div class="text-xs text-gray-500">${formattedDate}</div>
                    </div>
                </div>
                <div class="text-gray-700 text-sm">${reply.content}</div>
            </div>
        `;
    }

    attachCommentEvents() {
        // 点赞按钮
        document.querySelectorAll('.like-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const commentId = parseInt(e.target.dataset.commentId);
                this.likeComment(commentId);
            });
        });

        // 回复按钮
        document.querySelectorAll('.reply-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const commentId = e.target.dataset.commentId;
                const replySection = document.querySelector(`.reply-section[data-comment-id="${commentId}"]`);
                replySection.classList.toggle('hidden');
            });
        });

        // 提交回复
        document.querySelectorAll('.submit-reply').forEach(button => {
            button.addEventListener('click', (e) => {
                const commentId = parseInt(e.target.dataset.commentId);
                const replySection = document.querySelector(`.reply-section[data-comment-id="${commentId}"]`);
                const input = replySection.querySelector('.reply-input');

                if (input.value.trim()) {
                    this.addReply(commentId, 'Guest', input.value.trim());
                    input.value = '';
                    replySection.classList.add('hidden');
                }
            });
        });

        // 分享按钮
        document.querySelectorAll('.share-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const commentId = e.target.dataset.commentId;
                this.shareComment(commentId);
            });
        });
    }

    likeComment(commentId) {
        const pageComments = this.comments[this.currentPage] || [];
        const comment = pageComments.find(c => c.id === commentId);

        if (comment) {
            comment.likes++;
            this.saveComments();
            this.renderComments();
        }
    }

    addReply(commentId, username, content) {
        const pageComments = this.comments[this.currentPage] || [];
        const comment = pageComments.find(c => c.id === commentId);

        if (comment) {
            const reply = {
                id: Date.now(),
                username: username,
                content: content,
                timestamp: new Date().toISOString()
            };

            comment.replies.push(reply);
            this.saveComments();
            this.renderComments();
        }
    }

    shareComment(commentId) {
        const url = `${window.location.href}#comment-${commentId}`;
        if (navigator.share) {
            navigator.share({
                title: 'Check out this comment on Anime Raid Wiki',
                url: url
            });
        } else {
            navigator.clipboard.writeText(url);
            this.showNotification('Comment link copied to clipboard!', 'success');
        }
    }

    // 评分功能
    loadRatings() {
        const saved = localStorage.getItem('animeRaidRatings');
        return saved ? JSON.parse(saved) : {};
    }

    saveRatings() {
        localStorage.setItem('animeRaidRatings', JSON.stringify(this.ratings));
    }

    updateRating(rating) {
        if (!this.ratings[this.currentPage]) {
            this.ratings[this.currentPage] = {
                total: 0,
                count: 0,
                userRatings: []
            };
        }

        this.ratings[this.currentPage].total += rating;
        this.ratings[this.currentPage].count++;
        this.ratings[this.currentPage].userRatings.push({
            rating: rating,
            timestamp: new Date().toISOString()
        });

        this.saveRatings();
        this.renderRating();
    }

    getAverageRating() {
        const pageRating = this.ratings[this.currentPage];
        if (!pageRating || pageRating.count === 0) return 0;
        return (pageRating.total / pageRating.count).toFixed(1);
    }

    renderRating() {
        const container = document.getElementById('rating-container');
        if (!container) return;

        const average = this.getAverageRating();
        const count = this.ratings[this.currentPage]?.count || 0;

        container.innerHTML = `
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold mb-4">User Rating</h3>
                <div class="flex items-center mb-4">
                    <div class="text-3xl font-bold text-yellow-500 mr-3">${average}</div>
                    <div>
                        <div class="flex items-center mb-1">
                            ${this.renderStars(average, false)}
                        </div>
                        <div class="text-sm text-gray-600">${count} rating${count !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                <div class="rating-input">
                    <p class="text-sm text-gray-700 mb-2">Rate this content:</p>
                    <div class="star-rating">
                        ${[1, 2, 3, 4, 5].map(star => `
                            <button class="star-rating-button text-2xl text-gray-300 hover:text-yellow-500 transition-colors" data-rating="${star}">
                                ⭐
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        // 添加评分事件
        document.querySelectorAll('.star-rating-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.updateRating(rating);
                this.showNotification('Thank you for your rating!', 'success');
            });

            button.addEventListener('mouseenter', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.highlightStars(rating);
            });
        });

        container.addEventListener('mouseleave', () => {
            this.highlightStars(this.getAverageRating());
        });
    }

    renderStars(rating, interactive = false) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        let stars = '';
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars += '<span class="text-yellow-500">⭐</span>';
            } else if (i === fullStars && hasHalfStar) {
                stars += '<span class="text-yellow-500">⭐</span>'; // 简化处理，使用满星
            } else {
                stars += '<span class="text-gray-300">⭐</span>';
            }
        }

        return stars;
    }

    highlightStars(rating) {
        document.querySelectorAll('.star-rating-button').forEach((button, index) => {
            if (index < rating) {
                button.classList.add('text-yellow-500');
                button.classList.remove('text-gray-300');
            } else {
                button.classList.remove('text-yellow-500');
                button.classList.add('text-gray-300');
            }
        });
    }

    // 收藏功能
    loadFavorites() {
        const saved = localStorage.getItem('animeRaidFavorites');
        return saved ? JSON.parse(saved) : [];
    }

    saveFavorites() {
        localStorage.setItem('animeRaidFavorites', JSON.stringify(this.favorites));
    }

    toggleFavorite() {
        const index = this.favorites.indexOf(this.currentPage);
        if (index > -1) {
            this.favorites.splice(index, 1);
            this.showNotification('Removed from favorites', 'info');
        } else {
            this.favorites.push(this.currentPage);
            this.showNotification('Added to favorites!', 'success');
        }
        this.saveFavorites();
        this.renderFavoriteButton();
    }

    isFavorite() {
        return this.favorites.includes(this.currentPage);
    }

    renderFavoriteButton() {
        const container = document.getElementById('favorite-button');
        if (!container) return;

        const isFav = this.isFavorite();

        container.innerHTML = `
            <button onclick="commentSystem.toggleFavorite()"
                    class="favorite-btn flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        isFav
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }">
                <span class="text-xl">${isFav ? '❤️' : '🤍'}</span>
                <span>${isFav ? 'Favorited' : 'Add to Favorites'}</span>
            </button>
        `;
    }

    // 设置事件监听器
    setupEventListeners() {
        // 评论表单提交
        const commentForm = document.getElementById('comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const username = document.getElementById('comment-username').value || 'Guest';
                const content = document.getElementById('comment-content').value;
                const rating = document.getElementById('comment-rating')?.value || 0;

                if (content.trim()) {
                    this.addComment(username, content, parseInt(rating));
                    commentForm.reset();
                    this.showNotification('Comment posted successfully!', 'success');
                }
            });
        }
    }

    // 通知系统
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const bgColor = {
            'success': 'bg-green-500',
            'error': 'bg-red-500',
            'warning': 'bg-yellow-500',
            'info': 'bg-blue-500'
        }[type];

        notification.className = `fixed top-20 right-4 z-50 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // 动画显示
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // 5秒后移除
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
}

// 全局变量
let commentSystem;

// 页面加载完成后初始化评论系统
document.addEventListener('DOMContentLoaded', () => {
    // 为需要评论系统的页面添加HTML结构
    const commentHTML = `
        <div class="max-w-4xl mx-auto px-4 py-8">
            <!-- 评分区域 -->
            <div id="rating-container" class="mb-8"></div>

            <!-- 收藏按钮 -->
            <div class="mb-6 flex justify-between items-center">
                <h2 class="text-2xl font-bold">Comments & Discussion</h2>
                <div id="favorite-button"></div>
            </div>

            <!-- 评论表单 -->
            <div class="bg-white rounded-lg shadow p-6 mb-8">
                <h3 class="text-lg font-semibold mb-4">Leave a Comment</h3>
                <form id="comment-form" class="space-y-4">
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
                            <input type="text" id="comment-username"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="Enter your name">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                            <select id="comment-rating" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="0">No Rating</option>
                                <option value="1">1 Star - Poor</option>
                                <option value="2">2 Stars - Fair</option>
                                <option value="3">3 Stars - Good</option>
                                <option value="4">4 Stars - Very Good</option>
                                <option value="5">5 Stars - Excellent</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                        <textarea id="comment-content" rows="4" required
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Share your thoughts, tips, or questions..."></textarea>
                    </div>
                    <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Post Comment
                    </button>
                </form>
            </div>

            <!-- 评论列表 -->
            <div id="comments-container"></div>
        </div>
    `;

    // 只在特定页面添加评论系统
    const shouldAddComments =
        window.location.pathname.includes('/guides/') ||
        window.location.pathname.includes('/database/units/') ||
        window.location.pathname.includes('/tools/');

    if (shouldAddComments) {
        // 在主要内容后添加评论区域
        const mainContent = document.querySelector('main');
        if (mainContent) {
            const commentDiv = document.createElement('div');
            commentDiv.innerHTML = commentHTML;
            mainContent.appendChild(commentDiv.firstElementChild);
        }

        // 初始化评论系统
        commentSystem = new CommentSystem();
    }
});

// 导出到全局作用域
window.commentSystem = commentSystem;