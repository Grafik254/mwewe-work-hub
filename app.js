
const SUPABASE_URL = "https://hnbzmfzeyxdbnfpvmcxr.supabase.co";
const SUPABASE_KEY = "sb_publishable_yoLbDoXhXcetwuUa1kfOGA_zKIcsESt";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "Signing in...";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { data, error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    message.textContent = error.message;
    return;
  }

  await showDashboard(data.user);
});

async function showDashboard(user) {
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    alert("Account profile could not be loaded: " + profileError.message);
    return;
  }

  const isAdmin = profile.role === "admin";

  document.body.innerHTML = `
    <header>
      <div class="brand">
        MWEWE
        <small>CLEANING & FUMIGATION SERVICES LTD</small>
      </div>
      <button class="btn" id="logout">Sign out</button>
    </header>

    <section>
      <h1>Welcome, ${escapeText(profile.display_name || user.email)}!</h1>
      <p>Account: ${escapeText(profile.role)}</p>

      ${isAdmin ? `
        <div class="card">
          <h2>Add New Project</h2>
          <form id="projectForm">
            <label>Project title</label>
            <input id="projectTitle" required placeholder="Enter project title">

            <label>Project description</label>
            <textarea id="projectDescription" rows="4"
              style="width:100%;padding:13px;margin:9px 0 17px;border:1px solid #ccd8d1;border-radius:6px"
              placeholder="Describe the project"></textarea>

            <label>Assign project to employee</label>
            <select id="projectEmployee" required
              style="width:100%;padding:13px;margin:9px 0 17px;border:1px solid #ccd8d1;border-radius:6px">
              <option value="">Loading employees...</option>
            </select>

            <label>Project status</label>
            <select id="projectStatus"
              style="width:100%;padding:13px;margin:9px 0 17px;border:1px solid #ccd8d1;border-radius:6px">
              <option>Not started</option>
              <option>In progress</option>
              <option>Completed</option>
            </select>

            <button class="btn" type="submit">Create Project</button>
            <p id="projectMessage"></p>
          </form>
        </div>
      ` : ""}

      <h2>${isAdmin ? "All Company Projects" : "My Projects"}</h2>
      <div id="projects">Loading projects...</div>
    </section>
  `;

  document.getElementById("logout").onclick = async () => {
    await db.auth.signOut();
    location.reload();
  };

  if (isAdmin) {
    await loadEmployees();
    document.getElementById("projectForm").addEventListener(
      "submit",
      createProject
    );
  }

  await loadProjects();
}

async function loadEmployees() {
  const select = document.getElementById("projectEmployee");

  const { data: employees, error } = await db
    .from("profiles")
    .select("id, display_name, email")
    .eq("role", "employee")
    .order("display_name");

  if (error) {
    select.innerHTML = `<option value="">Could not load employees</option>`;
    document.getElementById("projectMessage").textContent = error.message;
    return;
  }

  if (!employees.length) {
    select.innerHTML = `<option value="">No employees found</option>`;
    return;
  }

  select.innerHTML = `
    <option value="">Select an employee</option>
    ${employees.map(employee => `
      <option value="${escapeText(employee.id)}">
        ${escapeText(employee.display_name || employee.email)}
      </option>
    `).join("")}
  `;
}

async function createProject(event) {
  event.preventDefault();

  const title = document.getElementById("projectTitle").value.trim();
  const description = document.getElementById("projectDescription").value.trim();
  const ownerId = document.getElementById("projectEmployee").value;
  const status = document.getElementById("projectStatus").value;
  const projectMessage = document.getElementById("projectMessage");

  if (!ownerId) {
    projectMessage.textContent = "Please select an employee.";
    return;
  }

  projectMessage.textContent = "Creating project...";

  const { error } = await db
    .from("projects")
    .insert([{
      title,
      description,
      owner_id: ownerId,
      status
    }]);

  if (error) {
    projectMessage.textContent = "Could not create project: " + error.message;
    return;
  }

  projectMessage.textContent = "Project created successfully!";

  document.getElementById("projectForm").reset();

  await loadProjects();
}

async function loadProjects() {
  const container = document.getElementById("projects");

  const { data: projects, error } = await db
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    container.textContent = "Could not load projects: " + error.message;
    return;
  }

  container.innerHTML = projects.length
    ? projects.map(project => `
        <div class="card" style="margin:15px 0">
          <h3>${escapeText(project.title)}</h3>
          <p>${escapeText(project.description || "")}</p>
          <p><strong>Status:</strong> ${escapeText(project.status || "Not set")}</p>
        </div>
      `).join("")
    : "<p>No projects have been added yet.</p>";
}

function escapeText(value) {
  const element = document.createElement("div");
  element.textContent = String(value ?? "");
  return element.innerHTML;
}

