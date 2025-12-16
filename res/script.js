"use strict;"

// page content [SPA]
const pages = {
    home: `
    <p>
    hello world!
    </br></br>
    This page is under construction :)</br></br>
    <img src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Lunch_atop_a_Skyscraper_-_Charles_Clyde_Ebbets.jpg" alt="construction" width="30%">
    </p>
      `,
    projects: `
    <p>
    Here's some of the stuff I've worked on:
        <ul>
            <li>I made HOoT's website: <a href="https://h0otu.github.io/" target="_blank">HOoT</a></li>
            <li>Hackathon frontend draft: <a href="routu/index.html" target="_blank">rouTU OwlHacks2025</a></li>
        </ul>
    </p>
    `,
    research: `
    <p>
        I am currently doing astrophysics research. My current interests are:
        <ul>
        <li> radio astronomy (pulsar observations) </li>
        <li> high-energy gamma ray astrophysics (unassociated sources). </li>
        </ul>
    </p>`
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
    if (e.target.classList.contains('link')) {
        e.preventDefault();
        const page = e.target.getAttribute('title');
        window.location.hash = page;
        renderPage(page);
        setActiveLink(page);
    }
}

function setActiveLink(page) {
    document.querySelectorAll('.link').forEach(link => {
        if (link.getAttribute('title') === page) {
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
    document.querySelector('link').addEventListener('click', handleNav);
    // Listen for hash changes (back/forward)
    window.addEventListener('hashchange', () => {
        let page = window.location.hash.replace('#', '') || 'home';
        renderPage(page);
        setActiveLink(page);
    });
}

window.addEventListener('DOMContentLoaded', initSPA);