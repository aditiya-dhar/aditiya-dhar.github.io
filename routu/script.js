// Your map initialization code here...

// Auth0 initialization
async function initAuth0() {
  const auth0 = await createAuth0Client({
    domain: "YOUR_AUTH0_DOMAIN",
    client_id: "YOUR_AUTH0_CLIENT_ID",
    redirect_uri: window.location.origin
  });

  // Handle Auth0 redirect callback
  if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
    await auth0.handleRedirectCallback();
    window.history.replaceState({}, document.title, "/");
  }

  // Authentication management
  const isAuthenticated = await auth0.isAuthenticated();
  const authBtn = document.getElementById("auth-btn");

  if (isAuthenticated) {
    const user = await auth0.getUser();
    authBtn.textContent = "Log Out";
    authBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await auth0.logout({ returnTo: window.location.origin });
    });
  } else {
    authBtn.textContent = "Sign In / Sign Up";
    authBtn.addEventListener("click", (e) => {
      e.preventDefault();
      auth0.loginWithRedirect();
    });
  }
}

// Show error message
function showErrorMessage(message) {
  const errorPopup = document.getElementById("error-popup");
  errorPopup.textContent = message;
  errorPopup.classList.add("visible");

  // Hide after 10 seconds
  setTimeout(() => {
    errorPopup.classList.remove("visible");
  }, 10000); // Hide after 10 seconds
}

// Initialize on page load
window.onload = initAuth0;
