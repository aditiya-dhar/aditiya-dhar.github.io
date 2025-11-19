"use strict;"

// page content [SPA]
const pages = {
    home: `
        <h1><a href="https://aditiya-dhar.github.io" title="home" style="text-decoration: none; color: black;">adi</a></h1>
  <h2>hello, world<h2>
  </body>
  <p>
    <ul>
      <li>I made HOoT's website: <a href="https://h0otu.github.io/">HOoT</a></li>
      <li>Hackathon frontend draft: <a href="routu/index.html">rouTU OwlHacks2025</a></li>
    </ul>
  </p>
  <br>
  <h2>This page is under construction :)</h2>
  <img class="background" src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Lunch_atop_a_Skyscraper_-_Charles_Clyde_Ebbets.jpg" alt="construction" width="30%">
      `
};

function renderPage(page) {
    const main = document.getElementById('main-content');
    if (pages[page]) {
        main.innerHTML = pages[page];
    } else {
        main.innerHTML = pages['home'];
    }
}

function handleNav(e) {
    if (e.target.classList.contains('nav-link')) {
        e.preventDefault();
        const page = e.target.getAttribute('data-page');
        window.location.hash = page;
        renderPage(page);
        setActiveLink(page);
    }
}

function setActiveLink(page) {
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function initSPA() {
    // Initial render
    let page = window.location.hash.replace('#', '') || 'home';
    renderPage(page);
    setActiveLink(page);
    // Listen for nav clicks
    document.querySelector('nav').addEventListener('click', handleNav);
    // Listen for hash changes (back/forward)
    window.addEventListener('hashchange', () => {
        let page = window.location.hash.replace('#', '') || 'home';
        renderPage(page);
        setActiveLink(page);
    });
}

window.addEventListener('DOMContentLoaded', initSPA);