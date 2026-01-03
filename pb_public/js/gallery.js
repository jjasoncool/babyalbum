const pb = new PocketBase(window.location.origin);
const PER_PAGE = 8;

async function loadSettings(page = 'home') {
    try {
        const setting = await pb.collection('site_settings').getFirstListItem(`page="${page}"`, {
            sort: '-created',
        });
        if (setting.title) $('#site-title').text(setting.title);
        if (setting.subtitle) $('#site-subtitle').html(setting.subtitle);
    } catch (err) {
        // Silent fail if no settings found
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
                <li class="btn ${currentPage === 'awards' ? 'active' : ''}"><a href="#awards">Awards</a></li>
                <li class="btn ${currentPage === 'contact' ? 'active' : ''}"><a href="#contact">Contact</a></li>
                <li class="btn"><a rel="nofollow" href="http://www.facebook.com/templatemo" target="_parent">External</a></li>
            </ul>
        </nav>
    `;
    $('.main-container').prepend(navHtml);
}

function loadContent(page) {
    const pageMap = {
        'home': 'home.html',
        'about': 'about.html',
        'awards': 'awards.html',
        'contact': 'contact.html'
    };
    const file = pageMap[page];
    $('#dynamic-content').load(`${file} .content-container`, function() {
        if (page === 'home') {
            loadPage(1);
        }
        loadSettings(page);
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
