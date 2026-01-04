const pb = new PocketBase(window.location.origin);
const PER_PAGE = 8;

async function loadSettings(page = 'home') {
    try {
        const setting = await pb.collection('site_settings').getFirstListItem(`page="${page}"`, {
            sort: '-created',
        });
        // 如果有資料就設定，沒有資料就清空（顯示空白）
        $('#site-title').text(setting.title || '');
        $('#site-subtitle').html(setting.subtitle || '');
    } catch (err) {
        // 如果出錯也清空（顯示空白）
        $('#site-title').text('');
        $('#site-subtitle').html('');
    }
}

async function loadPage(page) {
    try {
        const result = await pb.collection('photos').getList(page, PER_PAGE, {
            sort: '-created',
        });
        renderPhotos(result.items);
        renderPagination(result.page, result.totalPages);
    } catch (err) {
        console.error(err);
        $('#gallery-container').html('<p>尚無照片或無法讀取資料 (請確認 photos Collection 是否已建立且設為公開)。</p>');
    }
}

function renderPhotos(items) {
    const $container = $('#gallery-container');
    $container.empty();

    const $pageDiv = $('<div class="portfolio-page" style="display:block;"></div>');

    $.each(items, function(index, item) {
        const imgUrl = pb.files.getUrl(item, item.image);
        const html = `
            <div class="portfolio-group">
                <a class="portfolio-item" href="${imgUrl}">
                    <img src="${imgUrl}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">
                    <div class="detail">
                        <h3>${item.title}</h3>
                        <p>${item.description || ''}</p>
                        <span class="btn">View</span>
                    </div>
                </a>
            </div>
        `;
        $pageDiv.append(html);
    });
    $container.append($pageDiv);

    // Re-init magnific popup
    if ($.fn.magnificPopup) {
        $('.portfolio-item').magnificPopup({
            type: 'image',
            gallery:{ enabled:true }
        });
    }
}

function renderPagination(currentPage, totalPages) {
    const $container = $('#gallery-pagination');
    if (totalPages <= 1) {
        $container.empty();
        return;
    }

    let html = '<ul class="nav">';
    for(let i=1; i<=totalPages; i++) {
        html += `<li class="${i === currentPage ? 'active' : ''}" style="cursor:pointer;" onclick="loadPage(${i})">${i}</li>`;
    }
    html += '</ul>';
    $container.html(html);
}

function generateNav(currentPage) {
    const navHtml = `
        <nav class="main-nav">
            <div id="logo" class="left"><a href="#home">Mini Mochi</a></div>
            <ul class="nav right center-text">
                <li class="btn ${currentPage === 'home' ? 'active' : ''}"><a href="#home">Home</a></li>
                <li class="btn ${currentPage === 'about' ? 'active' : ''}"><a href="#about">About</a></li>
                <li class="btn ${currentPage === 'timeline' ? 'active' : ''}"><a href="#timeline">Timeline</a></li>
                <li class="btn ${currentPage === 'guestbook' ? 'active' : ''}"><a href="#guestbook">Guestbook</a></li>
            </ul>
        </nav>
    `;
    $('.main-container').prepend(navHtml);
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    // 格式化日期為中文格式
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${year}年${month}月${day}日`;

    // 計算相對時間
    let relativeStr;
    if (days === 0) relativeStr = '今天';
    else if (days === 1) relativeStr = '昨天';
    else if (days < 7) relativeStr = `${days} 天前`;
    else if (days < 30) relativeStr = `${Math.floor(days / 7)} 週前`;
    else if (days < 365) relativeStr = `${Math.floor(days / 30)} 個月前`;
    else relativeStr = `${Math.floor(days / 365)} 年前`;

    return `${dateStr}|${relativeStr}`;
}

async function loadTimelineEvents() {
    try {
        const records = await pb.collection('timeline_events').getFullList({
            sort: '-date'
        });

        const $container = $('.container-fluid');
        $container.empty();

        records.forEach((record, index) => {
            // 所有項目都放在左邊，跟原本設計一樣
            const timelineClass = 'left_timeline';
            const captionClass = 'left';
            const iconClass = 'right';

            let html = `<div class="time_line_wap ${timelineClass}">`;
            html += '<div class="time_line_paragraph">';

            // Date caption
            const dateInfo = formatDateTime(record.date);
            const [dateStr, relativeStr] = dateInfo.split('|');
            html += `<div class="time_line_caption ${captionClass}">${dateStr}<br><small>${relativeStr}</small></div>`;

            // Icon
            if (record.icon) {
                let iconHtml;
                if (record.icon.includes('<')) {
                    // 如果包含 HTML 標籤，加上樣式
                    if (record.icon.includes('<i ')) {
                        iconHtml = record.icon.replace('<i ', '<i style="font-size: 48px;" ');
                    } else if (record.icon.includes('<span ')) {
                        iconHtml = record.icon.replace('<span ', '<span style="font-size: 48px;" ');
                    } else if (record.icon.includes('<i>') || record.icon.includes('<i ')) {
                        iconHtml = record.icon.replace('<i', '<i style="font-size: 48px;"');
                    } else if (record.icon.includes('<span>') || record.icon.includes('<span ')) {
                        iconHtml = record.icon.replace('<span', '<span style="font-size: 48px;"');
                    } else {
                        // 如果沒有找到特定標籤，在開頭加上 span
                        iconHtml = `<span style="font-size: 48px;">${record.icon}</span>`;
                    }
                } else {
                    // 否則加上 MDI class 和樣式
                    iconHtml = `<i class="mdi mdi-${record.icon}" style="font-size: 48px;"></i>`;
                }
                html += `<div class="time_line_icon ${iconClass}">${iconHtml}</div>`;
            }

            // Title
            if (record.title) {
                html += `<h1>${record.title}</h1>`;
            }

            // Content
            if (record.content) {
                html += `<div style="line-height: 1.4; margin-top: 10px;">${record.content}</div>`;
            }

            html += '</div></div>';
            $container.append(html);
        });

        if (records.length === 0) {
            $container.html('<p>尚無大事記。</p>');
        }
    } catch (err) {
        console.error('載入 timeline 事件失敗:', err);
        $('.container-fluid').html('<p>無法載入大事記，請稍後再試。</p>');
    }
}

async function loadAboutContent() {
    try {
        const records = await pb.collection('about_content').getFullList({
            sort: 'updated'
        });

        const $container = $('.about-detail');
        $container.empty();

        records.forEach(record => {
            let html = `<div class="about-item" style="clear: both; margin-bottom: 40px;">`;
            html += `<h1>${record.role}</h1>`;

            if (record.image) {
                const imgUrl = pb.files.getUrl(record, record.image);
                html += `<img src="${imgUrl}" alt="${record.role}" class="left shadow" style="width: 250px; height: 250px; object-fit: cover; margin-right: 20px;">`;
            }

            if (record.content) {
                html += `<div>${record.content}</div>`;
            }

            html += '</div>';
            $container.append(html);
        });

        if (records.length === 0) {
            $container.html('<p>尚無關於我們的內容。</p>');
        }
    } catch (err) {
        console.error('載入 about 內容失敗:', err);
        $('.about-detail').html('<p>無法載入內容，請稍後再試。</p>');
    }
}

async function loadGuestbookMessages() {
    try {
        const messages = await pb.collection('guestbook_messages').getFullList({
            sort: '-created'
        });

        const $container = $('#messages-list');
        $container.empty();

        if (messages.length === 0) {
            $container.html('<p>還沒有留言，快來留下第一則吧！</p>');
            return;
        }

        messages.forEach(message => {
            const date = new Date(message.created);
            const dateStr = date.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            let html = '<div class="message-item">';
            if (message.name) {
                html += `<div class="message-author"><span class="mdi mdi-account"></span>${message.name}</div>`;
            }
            html += `<div class="message-content">${message.message}</div>`;
            html += `<div class="message-date"><span class="mdi mdi-clock"></span>${dateStr}</div>`;
            html += '</div>';

            $container.append(html);
        });
    } catch (err) {
        console.error('載入留言失敗:', err);
        $('#messages-list').html('<p>無法載入留言，請稍後再試。</p>');
    }
}

async function submitGuestbookMessage(event) {
    event.preventDefault();

    const $form = $('#guestbook-form');
    const $submitBtn = $('#submit-message');

    const name = $('#guestbook-name').val().trim();
    const email = $('#guestbook-email').val().trim();
    const message = window.quill ? window.quill.root.innerHTML.trim() : '';

    if (!name) {
        alert('請輸入您的暱稱');
        return;
    }

    // Email 驗證：如果有輸入 email，要檢查格式
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('請輸入有效的 email 格式');
        return;
    }

    if (!message || message === '<p><br></p>' || message === '') {
        alert('請輸入留言內容');
        return;
    }

    // 禁用提交按鈕防止重複提交
    $submitBtn.prop('disabled', true).text('發送中...');

    try {
        const data = {
            name: name || null,
            email: email || null,
            message: message
        };

        await pb.collection('guestbook_messages').create(data);

        // 清空表單
        $form[0].reset();
        // 清空富文本編輯器
        if (window.quill) {
            window.quill.setContents([]);
        }

        // 重新載入留言
        await loadGuestbookMessages();

        alert('留言發送成功！');
    } catch (err) {
        console.error('發送留言失敗:', err);
        alert('發送留言失敗，請稍後再試。');
    } finally {
        $submitBtn.prop('disabled', false).text('Send Message');
    }
}

function loadContent(page) {
    const pageMap = {
        'home': 'home.html',
        'about': 'about.html',
        'timeline': 'timeline.html',
        'guestbook': 'guestbook.html'
    };
    const file = pageMap[page];
    $('#dynamic-content').load(`${file} .content-container`, function() {
        // 无论是否有数据，都调用loadSettings来更新或清空title/subtitle
        loadSettings(page);
        if (page === 'home') {
            loadPage(1);
        } else if (page === 'about') {
            loadAboutContent();
        } else if (page === 'timeline') {
            loadTimelineEvents();
        } else if (page === 'guestbook') {
            loadGuestbookMessages();
            // 初始化 Quill 編輯器
            if (typeof Quill !== 'undefined') {
                window.quill = new Quill('#guestbook-message', {
                    theme: 'snow',
                    placeholder: 'Your Message',
                    modules: {
                        toolbar: [
                            ['bold', 'italic', 'underline'],
                            ['link', 'image'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['clean']
                        ]
                    }
                });
            }
            // 添加表單提交事件監聽器
            $('#guestbook-form').off('submit').on('submit', submitGuestbookMessage);
        }
    });
}

// Gallery functions are loaded by index.html for SPA

/* =========================================
   Merged from templatemo_script.js
   ========================================= */

/*  Pagination (Legacy static pagination support) */
function changePage(event) {
  var pageNo = $(this).html();
  $('.portfolio-page').hide();
  $('#page-' + pageNo).fadeIn();
  $('.pagination li').removeClass('active');
  $(this).addClass('active');
}

/*  Google Map */
function loadScript() {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&' +
      'callback=initialize';
  document.body.appendChild(script);
}

function initialize() {
    var mapOptions = {
      zoom: 12,
      center: new google.maps.LatLng(40.7823234,-73.9654161)
    };
    var map = new google.maps.Map(document.getElementById('templatemo_map'),  mapOptions);
}
