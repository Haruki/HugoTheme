document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.getElementById('search-input');
  const articleNavs = document.querySelectorAll('.article_nav');

  searchInput.addEventListener('input', function () {
    const query = this.value.toLowerCase();

    articleNavs.forEach(function (articleNav) {
      const title = articleNav.textContent.toLowerCase();

      if (title.includes(query) && query.length >= 3) {
        articleNav.style.display = 'block';
      } else {
        articleNav.style.display = 'none';
      }
    });
  });
});
