export function initAuth() {
  const session = localStorage.getItem("session");
  if (!session) {
    // No session: send to standalone login page
    const here = location.pathname.endsWith("/auth/login.html");
    const onSignup = location.pathname.endsWith("/auth/signup.html");
    if (!here && !onSignup) location.href = "./auth/login.html";
    return;
  }
}
