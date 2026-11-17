
const SUPABASE_URL = "https://hnbzmfzeyxdbnfpvmcxr.supabase.co";
const SUPABASE_KEY = "sb_publishable_yoLbDoXhXcetwuUa1kfOGA_zKIcsESt;

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  message.textContent = "Signing in...";

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    message.textContent = error.message;
    return;
  }

  const user = data.user;

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    message.textContent = "Account profile could not be loaded.";
    return;
  }

  document.body.innerHTML = `
    <header>
      <div class="brand">
        MWEWE
        <small>CLEANING & FUMIGATION SERVICES LTD</small>
      </div>
      <button class="btn" id="logout">Sign out</button>
    </header>
    <section>
      <h1>Welcome, ${profile.display_name || user.email}!</h1>
      <p>Account: ${profile.role}</p>
      <h2>My Projects</h2>
      <div id="projects">Loading projects...</div>
    </section>
  `;

  document.getElementById("logout").onclick = async () => {
    await db.auth.signOut();
    location.reload();
  };

  const { data: projects, error: projectError } = await db
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const container = document.getElementById("projects");

  if (projectError) {
    container.textContent = projectError.message;
    return;
  }

  container.innerHTML = projects.length
    ? projects.map(p => `
        <div class="card">
          <h3>${escapeText(p.title)}</h3>
          <p>${escapeText(p.description || "")}</p>
          <p>Status: ${escapeText(p.status)}</p>
        </div>
      `).join("")
    : "<p>No projects have been added yet.</p>";
});

function escapeText(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}
